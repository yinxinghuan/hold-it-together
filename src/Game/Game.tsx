import { useRef, useState, useEffect, useCallback } from 'react';
import { CARDS, Card, tierFor, clamp } from './cards';
import { unlock, playSwipe, playGood, playBad, playDay, playGameOver } from './audio';
import { t, loc } from './i18n';
import { useGameScore, Leaderboard } from '@shared/leaderboard';
import './Game.less';

const BEST_KEY = 'hold_it_together_best';
const BASE = (import.meta as any).env?.BASE_URL ?? '/';
const faceImg = (i: number) => `${BASE}faces/face${Math.max(0, Math.min(10, i))}.png`;
const THRESHOLD = 84;   // px past which a swipe commits
const START_MIND = 60;
const START_MONEY = 55;

type Phase = 'play' | 'over';
type Crash = 'mind' | 'money';

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function Game() {
  const [mind, setMind] = useState(START_MIND);
  const [money, setMoney] = useState(START_MONEY);
  const [day, setDay] = useState(1);
  const [phase, setPhase] = useState<Phase>('play');
  const [crash, setCrash] = useState<Crash>('mind');
  const [best, setBest] = useState(() => parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10));
  const [card, setCard] = useState<Card>(() => CARDS[Math.floor(Math.random() * CARDS.length)]);
  const [drag, setDrag] = useState(0);
  const [fly, setFly] = useState(0);          // -1 / +1 while a card flies off
  const [touched, setTouched] = useState(false);
  const [flash, setFlash] = useState<{ mind: number; money: number } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { isInAigram, canRank, submitScore, fetchLeaderboard } = useGameScore();

  const deckRef = useRef<number[]>([]);
  const lastIdxRef = useRef<number>(CARDS.indexOf(card));
  const dragging = useRef(false);
  const startX = useRef(0);
  const busy = useRef(false);                 // true during fly-out animation

  const drawNext = useCallback(() => {
    if (deckRef.current.length === 0) {
      deckRef.current = shuffle(CARDS.map((_, i) => i));
      if (deckRef.current[0] === lastIdxRef.current && deckRef.current.length > 1) {
        [deckRef.current[0], deckRef.current[1]] = [deckRef.current[1], deckRef.current[0]];
      }
    }
    const i = deckRef.current.shift()!;
    lastIdxRef.current = i;
    setCard(CARDS[i]);
  }, []);

  // preload all 11 faces so the avatar never flashes when 内耗 level changes
  useEffect(() => {
    for (let i = 0; i <= 10; i++) { const im = new Image(); im.src = faceImg(i); }
  }, []);

  // submit best run to the platform leaderboard once per game over
  useEffect(() => {
    if (phase === 'over') {
      if (day > best) { localStorage.setItem(BEST_KEY, String(day)); setBest(day); }
      submitScore(day).catch(() => { /* silent */ });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback((dir: number) => {
    if (busy.current) return;
    const choice = dir < 0 ? card.left : card.right;
    busy.current = true;
    setDrag(dir * (window.innerWidth || 400));
    setFly(dir);
    playSwipe();
    setFlash({ mind: choice.mind, money: choice.money });
    setTimeout(() => {
      const nm = clamp(mind + choice.mind);
      const nMon = clamp(money + choice.money);
      setMind(nm);
      setMoney(nMon);
      if (choice.mind + choice.money >= 0) playGood(); else playBad();
      if (nm <= 0 || nMon <= 0) {
        setCrash(nm <= 0 ? 'mind' : 'money');
        playGameOver();
        setPhase('over');
        setDrag(0);
        setFly(0);
        busy.current = false;
        return;
      }
      setDay(d => d + 1);
      playDay();
      drawNext();
      setDrag(0);
      setFly(0);
      busy.current = false;
    }, 260);
    setTimeout(() => setFlash(null), 900);
  }, [card, mind, money, drawNext]);

  const onDown = (e: React.PointerEvent) => {
    if (busy.current || phase !== 'play') return;
    if (!touched) { unlock(); setTouched(true); }
    dragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setDrag(e.clientX - startX.current);
  };
  const onUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) >= THRESHOLD) commit(dx < 0 ? -1 : 1);
    else setDrag(0);
  };

  const restart = () => {
    deckRef.current = [];
    setMind(START_MIND); setMoney(START_MONEY); setDay(1);
    setDrag(0); setFly(0); setFlash(null);
    drawNext();
    setPhase('play');
  };

  const level = tierFor(mind);
  const tilt = Math.max(-16, Math.min(16, drag * 0.05));
  const transition = dragging.current ? 'none' : 'transform 0.26s cubic-bezier(.2,.7,.3,1)';
  const leanL = Math.max(0, Math.min(1, -drag / THRESHOLD));
  const leanR = Math.max(0, Math.min(1, drag / THRESHOLD));

  return (
    <div className="hit">
      <div className="hit__top">
        <Bar label={t('mind')} value={mind} kind="mind" flash={flash?.mind} />
        <Bar label={t('money')} value={money} kind="money" flash={flash?.money} />
        <div className="hit__day">{t('day')} {day}{t('dayUnit')}</div>
        {canRank && phase === 'play' && (
          <button className="hit__lb-mini" onPointerDown={(e) => { e.stopPropagation(); setShowLeaderboard(true); }}>
            {t('leaderboard')}
          </button>
        )}
      </div>

      <div className="hit__stage">
        {/* drag direction tint */}
        <div className="hit__edge hit__edge--l" style={{ opacity: leanL * 0.9 }}>{loc('左', 'L')}</div>
        <div className="hit__edge hit__edge--r" style={{ opacity: leanR * 0.9 }}>{loc('右', 'R')}</div>

        <div
          className={`hit__card${fly ? ' is-fly' : ''}`}
          style={{ transform: `translateX(${drag}px) rotate(${tilt}deg)`, transition }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="hit__who">{loc(card.who.zh, card.who.en)}</div>
          <div className="hit__face">
            <img src={faceImg(level)} alt="" draggable={false} />
          </div>
          <div className="hit__line">{loc(card.line.zh, card.line.en)}</div>

          <div className="hit__choices">
            <div className={`hit__choice hit__choice--l${leanL > 0.4 ? ' is-hot' : ''}`}>
              <span className="hit__choice-arrow">←</span>
              <span>{loc(card.left.label.zh, card.left.label.en)}</span>
            </div>
            <div className={`hit__choice hit__choice--r${leanR > 0.4 ? ' is-hot' : ''}`}>
              <span>{loc(card.right.label.zh, card.right.label.en)}</span>
              <span className="hit__choice-arrow">→</span>
            </div>
          </div>
        </div>

        {!touched && phase === 'play' && (
          <div className="hit__hint">
            <div className="hit__hint-title">{t('title')}</div>
            <div className="hit__hint-cta">{t('hint')}</div>
          </div>
        )}

        {phase === 'over' && (
          <div className="hit__over">
            <div className="hit__over-card">
              <div className="hit__over-face">
                <img src={faceImg(crash === 'mind' ? 10 : 8)} alt="" draggable={false} />
              </div>
              <div className="hit__over-title">{crash === 'mind' ? t('crashMind') : t('crashMoney')}</div>
              <div className="hit__over-sub">{crash === 'mind' ? t('crashMindSub') : t('crashMoneySub')}</div>
              <div className="hit__over-days">{t('survived')} <b>{day}</b> {loc('天', day === 1 ? 'day' : 'days')}</div>
              <div className="hit__over-best">{t('best')} {best}{loc(' 天', best === 1 ? ' day' : ' days')}</div>
              <button className="hit__retry" onPointerDown={restart}>{t('retry')}</button>
              {canRank && (
                <button className="hit__lb-btn" onPointerDown={() => setShowLeaderboard(true)}>{t('leaderboard')}</button>
              )}
            </div>
          </div>
        )}

        {showLeaderboard && (
          <Leaderboard
            gameName={t('title')}
            isInAigram={isInAigram}
            onClose={() => setShowLeaderboard(false)}
            fetch={fetchLeaderboard}
          />
        )}
      </div>
    </div>
  );
}

function Bar({ label, value, kind, flash }: { label: string; value: number; kind: 'mind' | 'money'; flash?: number }) {
  const low = value <= 25;
  return (
    <div className={`hit__bar hit__bar--${kind}${low ? ' is-low' : ''}`}>
      <span className="hit__bar-label">{label}</span>
      <span className="hit__bar-track">
        <span className="hit__bar-fill" style={{ width: `${clamp(value)}%` }} />
      </span>
      {flash !== undefined && flash !== 0 && (
        <span className={`hit__bar-delta${flash > 0 ? ' is-up' : ' is-down'}`}>{flash > 0 ? `+${flash}` : flash}</span>
      )}
    </div>
  );
}
