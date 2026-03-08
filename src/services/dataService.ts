import { v4 as uuidv4 } from 'uuid';

export interface ContributionDay {
  id: string;
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
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

  // Generate 53 weeks * 7 days = 371 days to cover the full grid
  for (let i = 0; i < 371; i++) {
    const currentDate = new Date(oneYearAgo);
    currentDate.setDate(oneYearAgo.getDate() + i);

    // Randomize contribution count
    // Weighted towards 0 to mimic real data
    const rand = Math.random();
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;

    if (rand > 0.7) {
      count = Math.floor(Math.random() * 5) + 1; // 1-5
      level = 1;
    }
    if (rand > 0.85) {
      count = Math.floor(Math.random() * 10) + 5; // 5-15
      level = 2;
    }
    if (rand > 0.95) {
      count = Math.floor(Math.random() * 20) + 15; // 15-35
      level = 3;
    }
    if (rand > 0.98) {
      count = Math.floor(Math.random() * 50) + 35; // 35+
      level = 4;
    }

    total += count;

    days.push({
      id: uuidv4(),
      date: currentDate.toISOString().split('T')[0],
      count,
      level,
    });
  }

  return { total, days };
};
