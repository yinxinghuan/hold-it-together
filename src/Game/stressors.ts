// The "pressure blocks" you stack in Hold It Together「撑住别崩」.
// Each is one modern-burnout stressor; you pile them on a wobbling tower and
// try not to let it topple (崩). Labels are short so they fit on a block.

export interface Stressor {
  zh: string;
  en: string;
  color: string;   // flat block fill (dark ink text on top)
}

export const STRESSORS: Stressor[] = [
  { zh: '加班',     en: 'Overtime',     color: '#f0b341' },
  { zh: '房租',     en: 'Rent',         color: '#5ad1c7' },
  { zh: 'KPI',      en: 'KPI',          color: '#ff8a8a' },
  { zh: '老妈电话', en: 'Mom Calls',    color: '#c9a7ff' },
  { zh: '周一会议', en: 'Mon Meeting',  color: '#7fb8ff' },
  { zh: '已读不回', en: 'Left on Read', color: '#f5a3c7' },
  { zh: '催婚',     en: 'Married Yet?', color: '#ffd24a' },
  { zh: '房贷',     en: 'Mortgage',     color: '#6fd08a' },
  { zh: '体检报告', en: 'Lab Results',  color: '#ff9d6b' },
  { zh: '同事甩锅', en: 'The Blame',    color: '#e08be0' },
  { zh: '信用卡',   en: 'Credit Card',  color: '#8ad0ff' },
  { zh: '早高峰',   en: 'Rush Hour',    color: '#f7c873' },
  { zh: '截止日',   en: 'Deadline',     color: '#ff7a7a' },
  { zh: '群 99+',   en: '99+ Unread',   color: '#7ad3b6' },
  { zh: '班味',     en: 'The Grind',    color: '#b8b8c8' },
  { zh: '内卷',     en: 'Rat Race',     color: '#9ccf8e' },
];

export function pickStressor(): Stressor {
  return STRESSORS[Math.floor(Math.random() * STRESSORS.length)];
}
