type Locale = 'zh' | 'en';

function detectLocale(): Locale {
  const o = alteruLocalStorage.getItem('game_locale');
  if (o === 'en' || o === 'zh') return o;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const STR = {
  title:     { zh: '撑住别崩',          en: 'Hold It Together' },
  tagline:   { zh: '当代内耗生存模拟',    en: 'a burnout survival sim' },
  hint:      { zh: '点一下放下压力，摞稳别让它崩', en: 'tap to drop — stack the stress, don\'t let it topple' },
  stacked:   { zh: '摞住',              en: 'STACKED' },
  best:      { zh: '最高',              en: 'BEST' },
  gameover:  { zh: '崩了',              en: 'IT TOPPLED' },
  goSub:     { zh: '终究还是没撑住',      en: 'you couldn\'t hold it together' },
  retry:     { zh: '再来一塔',          en: 'TRY AGAIN' },
  leaderboard: { zh: '排行榜',          en: 'LEADERBOARD' },
} as const;

const locale = detectLocale();

export function t(key: keyof typeof STR): string {
  return STR[key][locale];
}

export function loc(zh: string, en: string): string {
  return locale === 'zh' ? zh : en;
}

export const LOCALE = locale;
