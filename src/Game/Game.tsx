import { useEffect, useRef, useState } from 'react';
import { TowerGame, WORLD_W, WORLD_H } from './engine';
import { unlock } from './audio';
import { t } from './i18n';
import { useGameScore, Leaderboard } from '@shared/leaderboard';
import './Game.less';

const BEST_KEY = 'hold_it_together_best';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TowerGame | null>(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10));
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { isInAigram, canRank, submitScore, fetchLeaderboard } = useGameScore();

  const makeGame = (canvas: HTMLCanvasElement) => new TowerGame(canvas, {
    onScore: setScore,
    onGameOver: () => setOver(true),
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const game = makeGame(canvas);
    gameRef.current = game;
    if (import.meta.env.DEV) (window as any).__hit = () => gameRef.current;
    const onResize = () => game.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); game.destroy(); };
  }, []);

  // submit final score once per game over
  useEffect(() => {
    if (over && score > 0) submitScore(score).catch(() => { /* silent */ });
  }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  // persist best
  useEffect(() => {
    setBest(b => {
      if (score > b) { localStorage.setItem(BEST_KEY, String(score)); return score; }
      return b;
    });
  }, [score]);

  const onDown = () => {
    if (over) return;
    const g = gameRef.current!;
    if (!started) { unlock(); g.start(); setStarted(true); return; }
    g.drop();
  };

  const restart = () => {
    gameRef.current?.destroy();
    const game = makeGame(canvasRef.current!);
    gameRef.current = game;
    setScore(0); setOver(false); setStarted(true);
    unlock(); game.start();
  };

  return (
    <div className="hit">
      <div className="hit__hud">
        <div className="hit__panel">
          <span className="hit__plabel">{t('stacked')}</span>
          <span className="hit__num">{score}</span>
        </div>
        <div className="hit__panel hit__panel--hi">
          <span className="hit__plabel">{t('best')}</span>
          <span className="hit__num">{best}</span>
        </div>
        {canRank && !over && (
          <button className="hit__lb-mini" onPointerDown={(e) => { e.stopPropagation(); setShowLeaderboard(true); }}>
            {t('leaderboard')}
          </button>
        )}
      </div>

      <div className="hit__stage">
        <canvas
          ref={canvasRef}
          className="hit__canvas"
          style={{ aspectRatio: `${WORLD_W} / ${WORLD_H}` }}
          onPointerDown={onDown}
        />

        {!started && (
          <div className="hit__hint">
            <div className="hit__hint-title">{t('title')}</div>
            <div className="hit__hint-sub">{t('tagline')}</div>
            <div className="hit__hint-cta">{t('hint')}</div>
          </div>
        )}

        {over && (
          <div className="hit__over" onPointerDown={(e) => e.stopPropagation()}>
            <div className="hit__over-card">
              <div className="hit__over-title">{t('gameover')}</div>
              <div className="hit__over-sub">{t('goSub')}</div>
              <div className="hit__over-score">{score}</div>
              <div className="hit__over-best">{t('best')} {best}</div>
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
