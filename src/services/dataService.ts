import { v4 as uuidv4 } from 'uuid';

export interface ContributionDay {
  id: string;
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  // Mercari specific fields
  name: string;
  isOfficial: boolean;
  goodReviews: number;
  badReviews: number;
  bio: string;
  profileUrl: string;
  companyInfo?: string;
  windowColor?: 'blue' | 'white';
}

export interface ContributionData {
  total: number;
  days: ContributionDay[];
}

// GitHub contribution colors (light mode)
// export const CONTRIBUTION_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

// GitHub contribution colors (dark mode / city night theme)
// Red, Blue, White theme for MercariCity
export const CONTRIBUTION_COLORS = [
  '#161b22', // Level 0 (Background/Empty)
  '#3355ff', // Level 1 (Blue)
  '#ff3333', // Level 2 (Red)
  '#e0e0e0', // Level 3 (White/Grey)
  '#ffffff', // Level 4 (Bright White)
];

export const generateMockData = (): ContributionData => {
  const days: ContributionDay[] = [];
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  // Align to the previous Sunday to start the grid cleanly
  const dayOfWeek = oneYearAgo.getDay();
  oneYearAgo.setDate(oneYearAgo.getDate() - dayOfWeek);

  let total = 0;

  const PARTNER_COMPANIES = [
    "乐一番", "Buyee", "bibian", "FROM JAPAN", "Neokyo", "doorzo", "ZenMarket", "JPGOODBUY", "日淘市集", "Sendico", "TOKUKAI", "RITAO CHAN", "越洋购", "docobuy", "Rakutao", "8mart", "Anybuy", "Mydoso", "DEJAPAN／BIDBUY", "Japan Rabbit", "Letao／funbid", "JChere", "GOODY-JAPAN", "janbox", "Remambo", "元気GO", "japantimemall", "Gobuy", "JADEX", "Myday", "worldbridge", "CDJapan", "Kaerumall", "heyco", "InJapan", "精灵集市／エルフ・モール", "madme", "Rkongjian", "J&Y SYSTEM", "徳源株式会社", "小卷毛日本转运", "テールタウン", "BEX", "盒馬", "CBS日本", "EIGI TRADING CO.株式会社", "DORA日本購", "LCT", "普渡", "DK", "JANTO", "SUMO", "北極星日淘", "太古株式会社", "Buy&Ship", "EIKOLINE", "J-Subculture", "Otsukai", "DANKA", "SAZO", "laojin", "一番市集", "株式会社COOLTRACK JAPAN"
  ];

  // Generate ~2500 days to cover the requested counts (2000 apartments + 400 unfinished + commercial)
  for (let i = 0; i < 2500; i++) {
    const currentDate = new Date(oneYearAgo);
    currentDate.setDate(oneYearAgo.getDate() + i);

    const rand = Math.random();
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;

    // Determine type for mock data
    let isOfficial = false;
    let name = `User_${i}`;
    let goodReviews = Math.floor(Math.random() * 500);
    let badReviews = Math.floor(Math.random() * 10);
    let bio = "这是一个Mercari卖家的个人简介。";
    let profileUrl = "https://jp.mercari.com/";
    let companyInfo = "";
    let windowColor: 'blue' | 'white' = Math.random() > 0.5 ? 'blue' : 'white';

    // We'll assign types later by shuffling, but for now we set properties
    // based on the intended counts: 63 official, 400 bad, ~2000 regular.
    // However, to make it easier to shuffle, we can just use a random chance
    // but keep track of counts to be precise if needed.
    // Let's use a simpler approach: generate all, then shuffle.
    
    days.push({
      id: uuidv4(),
      date: currentDate.toISOString().split('T')[0],
      count: 0, // placeholder
      level: 0, // placeholder
      name,
      isOfficial,
      goodReviews,
      badReviews,
      bio,
      profileUrl,
      windowColor
    });
  }

  // Now assign roles and shuffle
  const indices = Array.from({ length: 2500 }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < 2500; i++) {
    const idx = indices[i];
    const day = days[idx];
    
    if (i < 63) {
      day.isOfficial = true;
      day.name = PARTNER_COMPANIES[i] || `Official_${i}`;
      day.goodReviews = Math.floor(Math.random() * 5000) + 1000;
      day.badReviews = Math.floor(Math.random() * 50);
      day.bio = `${day.name} 是Mercari官方认证的代购合作伙伴，提供专业的日本商品代购服务。`;
      day.companyInfo = `${day.name} 国际物流有限公司，成立于2015年，总部位于东京。`;
      
      if (day.name === "乐一番") {
        day.profileUrl = "https://jp.mercari.com/user/profile/937988083";
        day.goodReviews = 12500;
        day.badReviews = 12;
        day.bio = "乐一番是您的日本购物好帮手！我们提供转运、代购一站式服务，让您足不出户淘遍日本。";
      }
    } else if (i < 463) {
      day.isOfficial = false;
      day.name = `BadSeller_${i}`;
      day.goodReviews = Math.floor(Math.random() * 100);
      day.badReviews = Math.floor(Math.random() * 200) + 50;
      day.bio = "这个卖家有很多差评，请谨慎交易。";
    } else {
      day.isOfficial = false;
      day.name = `Seller_${i}`;
      day.goodReviews = Math.floor(Math.random() * 1000) + 50;
      day.badReviews = Math.floor(Math.random() * 5);
    }

    day.count = day.goodReviews;
    day.level = day.isOfficial ? 4 : (day.badReviews > 50 ? 2 : 1);
    total += day.count;
  }

  return { total, days };
};
