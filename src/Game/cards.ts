// Data for Hold It Together「撑住别崩」— a Reigns-style swipe-card game.
// Theme: surviving the daily grind as a chronically over-thinking young adult.
// Two opposing bars: 心力 (mental energy) and 钱包 (wallet). Either hitting 0 ends the run.
// Each choice trades one bar against the other — no free lunch.

export interface Loc { zh: string; en: string; }

export interface Choice {
  label: Loc;     // short response shown as you tilt the card
  mind: number;   // delta to 心力 (mental energy)
  money: number;  // delta to 钱包 (wallet)
}

export interface Card {
  id: string;
  who: Loc;       // who is talking / the source of the stressor
  line: Loc;      // the dilemma, in their voice
  left: Choice;   // swipe LEFT
  right: Choice;  // swipe RIGHT
}

// 11 内耗 levels mapped to 心力 (100 = calm → 0 = broken). Index 0 is healthiest.
export interface Tier { idx: number; nameZh: string; nameEn: string; quipZh: string; quipEn: string; }

export const TIERS: Tier[] = [
  { idx: 0,  nameZh: '状态在线', nameEn: 'Dialed In',   quipZh: '今天感觉能成事', quipEn: 'today I could actually do things' },
  { idx: 1,  nameZh: '略微疲惫', nameEn: 'A Bit Worn',  quipZh: '周一怎么又来了', quipEn: 'how is it Monday again' },
  { idx: 2,  nameZh: '有点烦',   nameEn: 'Mildly Done', quipZh: '已读不回是种修养', quipEn: 'leaving people on read is self-care' },
  { idx: 3,  nameZh: 'emo初期', nameEn: 'Pre-Spiral',  quipZh: '累，但说不上为什么', quipEn: 'tired for no nameable reason' },
  { idx: 4,  nameZh: '内耗中',   nameEn: 'Overthinking', quipZh: '那句话是不是说错了', quipEn: 'was that the wrong thing to say' },
  { idx: 5,  nameZh: '精神内耗', nameEn: 'In My Head',  quipZh: '在脑子里吵赢了全世界', quipEn: 'won every argument in my head' },
  { idx: 6,  nameZh: '重度内耗', nameEn: 'Deep Spiral', quipZh: '睁眼到天亮', quipEn: 'stared at the ceiling till dawn' },
  { idx: 7,  nameZh: '心力告急', nameEn: 'Running Low', quipZh: '已经笑不出来了', quipEn: 'can\'t fake the smile anymore' },
  { idx: 8,  nameZh: '濒临崩溃', nameEn: 'On the Edge', quipZh: '谁再找我我就哭', quipEn: 'one more ping and I cry' },
  { idx: 9,  nameZh: '一点就炸', nameEn: 'Hair Trigger', quipZh: '求求了别说话', quipEn: 'please just stop talking' },
  { idx: 10, nameZh: '已崩',     nameEn: 'Shattered',   quipZh: '……', quipEn: '......' },
];

export function tierFor(mind: number): number {
  const t = Math.round((100 - clamp(mind)) / 10);
  return Math.max(0, Math.min(10, t));
}

export function clamp(v: number): number { return Math.max(0, Math.min(100, v)); }

export const CARDS: Card[] = [
  {
    id: 'boss-night',
    who: { zh: '老板', en: 'Boss' },
    line: { zh: '深夜11:47——「在吗？这版方案明早改一下」', en: '11:47pm — "you up? small tweak to the deck by morning"' },
    left:  { label: { zh: '秒回「在的！」', en: '"on it!"' }, mind: -14, money: +9 },
    right: { label: { zh: '装睡不回', en: 'pretend to be asleep' }, mind: +7, money: -7 },
  },
  {
    id: 'mom-marriage',
    who: { zh: '妈', en: 'Mom' },
    line: { zh: '「你那同学孩子都打酱油了，你呢？」', en: '"your classmate already has two kids. and you?"' },
    left:  { label: { zh: '「在看在看」', en: '"looking, looking"' }, mind: -11, money: 0 },
    right: { label: { zh: '「别催了行吗」', en: '"can you not"' }, mind: -3, money: -8 },
  },
  {
    id: 'group-501',
    who: { zh: '工作群', en: 'Work Chat' },
    line: { zh: '「收到请回复」后面已经99+了', en: '"react if received" — already 99+ replies' },
    left:  { label: { zh: '抢一个「收到」', en: 'fire off "received"' }, mind: -6, money: +5 },
    right: { label: { zh: '默默退群', en: 'mute the whole thing' }, mind: +8, money: -5 },
  },
  {
    id: 'landlord',
    who: { zh: '房东', en: 'Landlord' },
    line: { zh: '「明年房租涨800，续不续？」', en: '"rent goes up $120 next year. renewing?"' },
    left:  { label: { zh: '咬牙续了', en: 'grit teeth, renew' }, mind: -7, money: -12 },
    right: { label: { zh: '搬去远点的', en: 'move somewhere cheaper' }, mind: -10, money: +9 },
  },
  {
    id: 'colleague-credit',
    who: { zh: '同事', en: 'Coworker' },
    line: { zh: '汇报时把你的活说成了「我们团队」', en: 'in the review they called your work "the team\'s"' },
    left:  { label: { zh: '当场点出来', en: 'call it out then and there' }, mind: -9, money: +7 },
    right: { label: { zh: '算了忍着', en: 'let it slide' }, mind: -12, money: 0 },
  },
  {
    id: 'gym-card',
    who: { zh: '销售', en: 'Salesperson' },
    line: { zh: '「办张年卡吧，新的一年新的自己」', en: '"get the annual pass — new year, new you"' },
    left:  { label: { zh: '冲动办了', en: 'sign up on impulse' }, mind: +6, money: -10 },
    right: { label: { zh: '「我再想想」', en: '"let me think about it"' }, mind: -4, money: +3 },
  },
  {
    id: 'ex-story',
    who: { zh: '前任', en: 'Your Ex' },
    line: { zh: '凌晨给你的动态点了个赞', en: 'liked your post at 3am' },
    left:  { label: { zh: '研究三小时', en: 'analyze it for 3 hours' }, mind: -13, money: 0 },
    right: { label: { zh: '直接划走', en: 'swipe away' }, mind: +9, money: 0 },
  },
  {
    id: 'wedding-gift',
    who: { zh: '老同学', en: 'Old Classmate' },
    line: { zh: '「下月结婚，记得来喝喜酒～」', en: '"getting married next month — come celebrate!"' },
    left:  { label: { zh: '随份子去', en: 'pay up, show up' }, mind: +4, money: -13 },
    right: { label: { zh: '「那天有事」', en: '"busy that day"' }, mind: -8, money: +2 },
  },
  {
    id: 'overtime',
    who: { zh: '组长', en: 'Team Lead' },
    line: { zh: '「今晚冲一下，绩效我记着」', en: '"push tonight, I\'ll remember it at review"' },
    left:  { label: { zh: '留下来肝', en: 'stay and grind' }, mind: -13, money: +11 },
    right: { label: { zh: '准点下班', en: 'leave on time' }, mind: +8, money: -6 },
  },
  {
    id: 'delivery',
    who: { zh: '自己', en: 'Yourself' },
    line: { zh: '不想做饭，又是要不要点外卖的拷问', en: 'too drained to cook. order in again?' },
    left:  { label: { zh: '点了', en: 'order it' }, mind: +7, money: -7 },
    right: { label: { zh: '泡面凑合', en: 'instant noodles' }, mind: -5, money: +4 },
  },
  {
    id: 'group-blame',
    who: { zh: '甲方', en: 'Client' },
    line: { zh: '「这不是我要的感觉，你再多改几版」', en: '"this isn\'t the vibe — do a few more versions"' },
    left:  { label: { zh: '「好的马上改」', en: '"sure, right away"' }, mind: -12, money: +8 },
    right: { label: { zh: '报个加急费', en: 'charge a rush fee' }, mind: -3, money: +6 },
  },
  {
    id: 'friend-mlm',
    who: { zh: '老友', en: 'Old Friend' },
    line: { zh: '突然热情约饭，全程在讲「项目」', en: 'suddenly wants dinner — it\'s all about "an opportunity"' },
    left:  { label: { zh: '碍于情面投了', en: 'cave and chip in' }, mind: -6, money: -14 },
    right: { label: { zh: '笑着拒绝', en: 'politely decline' }, mind: -7, money: +1 },
  },
  {
    id: 'phone-late',
    who: { zh: '凌晨两点', en: '2 a.m.' },
    line: { zh: '明知道该睡了，手指还在刷', en: 'you know you should sleep. thumb keeps scrolling.' },
    left:  { label: { zh: '再刷亿条', en: 'one more scroll' }, mind: -10, money: 0 },
    right: { label: { zh: '强行放下', en: 'put it down' }, mind: +10, money: 0 },
  },
  {
    id: 'raise',
    who: { zh: '自己', en: 'Yourself' },
    line: { zh: '攒了半年的勇气，要不要提涨薪', en: 'six months of courage — ask for a raise?' },
    left:  { label: { zh: '硬着头皮提', en: 'just ask' }, mind: -11, money: +15 },
    right: { label: { zh: '下次一定', en: 'next time for sure' }, mind: -5, money: -2 },
  },
  {
    id: 'sale',
    who: { zh: '购物车', en: 'Your Cart' },
    line: { zh: '「最后3件」「再不买就没了」', en: '"only 3 left" "selling out fast"' },
    left:  { label: { zh: '清空购物车', en: 'check out everything' }, mind: +8, money: -13 },
    right: { label: { zh: '关掉APP', en: 'close the app' }, mind: -3, money: +5 },
  },
  {
    id: 'dad-call',
    who: { zh: '爸', en: 'Dad' },
    line: { zh: '难得打来，问「钱够不够花」', en: 'a rare call — "you got enough money?"' },
    left:  { label: { zh: '「够够够」', en: '"plenty, plenty"' }, mind: -4, money: -3 },
    right: { label: { zh: '说了句实话', en: 'tell the truth' }, mind: +6, money: +7 },
  },
  {
    id: 'meeting',
    who: { zh: '会议', en: 'The Meeting' },
    line: { zh: '本可以一封邮件解决，却开了俩小时', en: 'could\'ve been an email. it\'s a two-hour call.' },
    left:  { label: { zh: '认真陪开', en: 'sit through it, engaged' }, mind: -9, money: +4 },
    right: { label: { zh: '挂机摸鱼', en: 'mute and zone out' }, mind: +6, money: -4 },
  },
  {
    id: 'relative',
    who: { zh: '亲戚', en: 'Relative' },
    line: { zh: '「一个月挣多少？给你介绍个对象」', en: '"how much you make? let me set you up"' },
    left:  { label: { zh: '报喜不报忧', en: 'inflate the number' }, mind: -8, money: 0 },
    right: { label: { zh: '转移话题', en: 'change the subject' }, mind: -3, money: 0 },
  },
  {
    id: 'sick',
    who: { zh: '身体', en: 'Your Body' },
    line: { zh: '嗓子哑了，明天有个重要的会', en: 'lost your voice. big meeting tomorrow.' },
    left:  { label: { zh: '硬撑去上班', en: 'power through' }, mind: -12, money: +6 },
    right: { label: { zh: '请假休息', en: 'take a sick day' }, mind: +11, money: -8 },
  },
  {
    id: 'fitness',
    who: { zh: '闹钟', en: 'Alarm' },
    line: { zh: '6点的晨跑闹钟响了第三遍', en: 'your 6am run alarm, third snooze' },
    left:  { label: { zh: '爬起来跑', en: 'get up, go run' }, mind: +9, money: 0 },
    right: { label: { zh: '再睡亿会', en: 'sleep forever' }, mind: -4, money: +2 },
  },
  {
    id: 'wechat-pay',
    who: { zh: '室友', en: 'Roommate' },
    line: { zh: '「这月水电我先垫了哈」（已三个月）', en: '"I covered the bills again" (third month running)' },
    left:  { label: { zh: '默默AA转钱', en: 'quietly pay your half' }, mind: -2, money: -9 },
    right: { label: { zh: '摊牌算总账', en: 'settle it once and for all' }, mind: -10, money: +12 },
  },
  {
    id: 'side-hustle',
    who: { zh: '凌晨的你', en: 'Late-Night You' },
    line: { zh: '刷到「副业月入过万」，心动了', en: 'saw a "$2k/month side hustle" reel. tempting.' },
    left:  { label: { zh: '熬夜搞副业', en: 'grind a side gig' }, mind: -11, money: +10 },
    right: { label: { zh: '关灯睡觉', en: 'lights off, sleep' }, mind: +8, money: -2 },
  },
  {
    id: 'reply-all',
    who: { zh: '邮件', en: 'Inbox' },
    line: { zh: '全公司「回复全部」开始连环轰炸', en: 'a company-wide "reply all" chain erupts' },
    left:  { label: { zh: '逐条已读', en: 'read every one' }, mind: -7, money: 0 },
    right: { label: { zh: '一键归档', en: 'archive all' }, mind: +5, money: 0 },
  },
  {
    id: 'birthday',
    who: { zh: '同事们', en: 'Coworkers' },
    line: { zh: '「凑钱给主管买生日礼物，一人200」', en: '"chipping in $30 each for the manager\'s gift"' },
    left:  { label: { zh: '跟着出钱', en: 'chip in with the crowd' }, mind: +3, money: -8 },
    right: { label: { zh: '装没看见群消息', en: 'miss the message' }, mind: -6, money: +1 },
  },
  {
    id: 'comparison',
    who: { zh: '朋友圈', en: 'Feed' },
    line: { zh: '同龄人晒升职、晒买房、晒娃', en: 'peers flexing promotions, houses, babies' },
    left:  { label: { zh: '挨个点赞', en: 'like them all' }, mind: -9, money: 0 },
    right: { label: { zh: '设为不看', en: 'hide the feed' }, mind: +7, money: 0 },
  },
  {
    id: 'tax',
    who: { zh: '账单', en: 'A Bill' },
    line: { zh: '一笔忘了的扣款，余额突然少一截', en: 'a forgotten auto-charge just hit your balance' },
    left:  { label: { zh: '认栽不查了', en: 'eat it, move on' }, mind: -3, money: -10 },
    right: { label: { zh: '打客服死磕', en: 'fight customer service' }, mind: -11, money: +9 },
  },
  {
    id: 'pet',
    who: { zh: '猫', en: 'The Cat' },
    line: { zh: '凌晨四点，它坐你胸口盯着你', en: '4am — it sits on your chest, staring' },
    left:  { label: { zh: '起来喂它', en: 'get up, feed it' }, mind: +5, money: -3 },
    right: { label: { zh: '装死不动', en: 'play dead' }, mind: -4, money: 0 },
  },
  {
    id: 'group-photo',
    who: { zh: '家族群', en: 'Family Group' },
    line: { zh: '七大姑转来「年轻人不要太丧」的文章', en: 'auntie forwards "young people shouldn\'t be so down"' },
    left:  { label: { zh: '回个「收到」', en: 'reply "noted 🙏"' }, mind: -6, money: 0 },
    right: { label: { zh: '已读不回', en: 'leave on read' }, mind: -2, money: 0 },
  },
  {
    id: 'promotion-trap',
    who: { zh: 'HR', en: 'HR' },
    line: { zh: '「升你做组长，工资先不变行不」', en: '"we\'ll make you lead — pay stays for now, ok?"' },
    left:  { label: { zh: '接了，画饼真香', en: 'take it, chase the carrot' }, mind: -13, money: +5 },
    right: { label: { zh: '「先涨薪再说」', en: '"pay first, then we talk"' }, mind: -6, money: +8 },
  },
  {
    id: 'weekend',
    who: { zh: '周日晚上', en: 'Sunday Night' },
    line: { zh: '一整天没干啥，又开始焦虑了', en: 'did nothing all day. the dread creeps in.' },
    left:  { label: { zh: '愧疚到失眠', en: 'spiral into guilt' }, mind: -10, money: 0 },
    right: { label: { zh: '允许自己摆烂', en: 'let yourself rest' }, mind: +9, money: -1 },
  },
];
