type Locale = 'zh' | 'en';

function detectLocale(): Locale {
  const o = localStorage.getItem('game_locale');
  if (o === 'en' || o === 'zh') return o;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const STR = {
  title:     { zh: '撑住别崩',          en: 'Hold It Together' },
  tagline:   { zh: '当代内耗生存模拟',    en: 'a burnout survival sim' },
  hint:      { zh: '左右滑动做选择',      en: 'swipe left or right to choose' },
  mind:      { zh: '心力',              en: 'SPIRIT' },
  money:     { zh: '钱包',              en: 'WALLET' },
  days:      { zh: '撑住天数',           en: 'DAYS' },
  best:      { zh: '最久',              en: 'BEST' },
  day:       { zh: '第',                en: 'DAY' },
  dayUnit:   { zh: '天',                en: '' },
  crashMind: { zh: '精神崩溃',           en: 'BURNED OUT' },
  crashMoney:{ zh: '破产了',            en: 'WENT BROKE' },
  crashMindSub:  { zh: '心力归零，撑不住了', en: 'spirit hit zero — you couldn\'t hold on' },
  crashMoneySub: { zh: '钱包见底，活不下去了', en: 'wallet hit zero — you couldn\'t go on' },
  survived:  { zh: '你撑了',            en: 'you held it together for' },
  retry:     { zh: '再撑一次',          en: 'TRY AGAIN' },
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
