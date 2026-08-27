import { BudgetCategory, ExpenseItem, PaySchedule, UserConfig } from '../types';

export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  {
    id: 'cat-essentials',
    name: 'Essentials',
    key: 'essentials',
    baselineWeeklyBudget: 420,
    currentWeeklyBudget: 420,
    color: '#5B7A58',      // Sage Green dark
    bgColor: '#EAF0E9',    // Sage Green soft
    borderColor: '#C6D7C4',
    iconName: 'ShoppingBag',
    description: 'Groceries, Gas, personal goods, home goods',
    examples: ['Groceries', 'Gas / Fuel', 'Personal goods', 'Home goods', 'Pharmacy']
  },
  {
    id: 'cat-fun-money',
    name: 'Fun Money',
    key: 'fun_money',
    baselineWeeklyBudget: 180,
    currentWeeklyBudget: 180,
    color: '#4B7B9E',      // Sky Blue slate
    bgColor: '#E6F0FA',    // Soft Sky Blue
    borderColor: '#C2D9EE',
    iconName: 'Coffee',
    description: 'Restaurants, Shopping, recreation',
    examples: ['Restaurants', 'Coffee & Drinks', 'Shopping', 'Entertainment', 'Hobbies']
  },
  {
    id: 'cat-bills',
    name: 'Bills',
    key: 'bills',
    baselineWeeklyBudget: 350,
    currentWeeklyBudget: 350,
    color: '#7C5E45',      // Earthy Brown
    bgColor: '#F5EFEA',    // Warm Sand/Brown
    borderColor: '#DDD0C4',
    iconName: 'Receipt',
    description: 'Subscriptions, mortgage/rent, utilities, fixed spending',
    examples: ['Rent / Mortgage', 'Electric / Water', 'Cell Phone', 'Subscriptions', 'Car Insurance']
  },
  {
    id: 'cat-savings',
    name: 'Savings',
    key: 'savings',
    baselineWeeklyBudget: 250,
    currentWeeklyBudget: 250,
    color: '#2D3E33',      // Deep Forest Green
    bgColor: '#E8ECE9',    // Forest light
    borderColor: '#BFCBC3',
    iconName: 'PiggyBank',
    description: 'Downpayment, daycare fund, Investing',
    examples: ['Emergency Fund', 'Downpayment', 'Daycare Fund', 'Retirement & Index Funds']
  }
];

export const INITIAL_USER_CONFIG: UserConfig = {
  name: 'Alex Rivera',
  email: 'alex@simplebudget.app',
  accountType: 'couple',
  roommatesCount: 1,
  rawIncome: 5200,
  paySchedule: 'monthly',
  weeklyIncomePool: 1200,
  calendarMode: 'weekly',
  isOnboarded: true,
  activeTabPreference: 'ai',
  simulationDayOffset: 0,
};

export function normalizeToWeeklyIncome(rawAmount: number, schedule: PaySchedule): number {
  if (!rawAmount || isNaN(rawAmount)) return 0;
  switch (schedule) {
    case 'weekly':
      return Math.round(rawAmount);
    case 'bi-weekly':
      return Math.round((rawAmount * 26) / 52);
    case 'monthly':
      return Math.round((rawAmount * 12) / 52);
    default:
      return Math.round(rawAmount);
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Date helpers
export function getSimulatedDate(dayOffset: number = 0): Date {
  const d = new Date();
  if (dayOffset !== 0) {
    d.setDate(d.getDate() + dayOffset);
  }
  return d;
}

export function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getWeekId(d: Date): string {
  const year = d.getFullYear();
  const weekNum = getWeekNumber(d);
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

export function getMonthId(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

export function getWeekRangeDisplay(d: Date): { start: string; end: string; full: string } {
  const curr = new Date(d);
  const day = curr.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(curr.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startFormatted = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFormatted = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  return {
    start: startFormatted,
    end: endFormatted,
    full: `${startFormatted} – ${endFormatted}`
  };
}

export function getRemainingWeeksInMonth(d: Date): number {
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const daysLeft = lastDayOfMonth.getDate() - d.getDate();
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  return weeksLeft;
}

/**
 * Weekly Check-in Status:
 * Active: Friday (5), Saturday (6), Sunday (0)
 * Past-Due: Monday (1) or Tuesday (2) if previous week wasn't checked in
 */
export function getCheckInStatus(simulatedDate: Date, isCompletedForThisWeek: boolean): {
  isActive: boolean;
  isPastDue: boolean;
  dayName: string;
  message: string;
} {
  if (isCompletedForThisWeek) {
    return {
      isActive: false,
      isPastDue: false,
      dayName: simulatedDate.toLocaleDateString('en-US', { weekday: 'long' }),
      message: 'Weekly check-in completed! Great discipline.',
    };
  }

  const dayOfWeek = simulatedDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const dayName = simulatedDate.toLocaleDateString('en-US', { weekday: 'long' });

  // Friday, Saturday, Sunday = Active Check-in window
  if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
    return {
      isActive: true,
      isPastDue: false,
      dayName,
      message: `It's ${dayName}! Time for your weekly financial check-in.`,
    };
  }

  // Monday / Tuesday = Past-Due Alert if not completed!
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    return {
      isActive: true,
      isPastDue: true,
      dayName,
      message: `PAST-DUE: Last week's check-in was missed. Realign your budget now!`,
    };
  }

  // Mid-week (Wed, Thu)
  return {
    isActive: false,
    isPastDue: false,
    dayName,
    message: `Weekly check-in unlocks on Friday. Keep logging expenses daily!`,
  };
}

// Initial realistic transactions seeded to feel immediately useful
export function getInitialExpenses(): ExpenseItem[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekId = getWeekId(today);
  const monthId = getMonthId(today);

  return [
    {
      id: 'tx-1',
      amount: 114.50,
      description: 'Trader Joe’s weekly groceries & produce',
      categoryId: 'cat-essentials',
      date: todayStr,
      timestamp: Date.now() - 1000 * 60 * 60 * 4,
      weekId,
      monthId,
    },
    {
      id: 'tx-2',
      amount: 45.00,
      description: 'Chevron Gas refill',
      categoryId: 'cat-essentials',
      date: todayStr,
      timestamp: Date.now() - 1000 * 60 * 60 * 18,
      weekId,
      monthId,
    },
    {
      id: 'tx-3',
      amount: 68.25,
      description: 'Dinner at Sourdough Pizzeria with partners',
      categoryId: 'cat-fun-money',
      date: todayStr,
      timestamp: Date.now() - 1000 * 60 * 60 * 28,
      weekId,
      monthId,
    },
    {
      id: 'tx-4',
      amount: 18.00,
      description: 'Matcha lattes & pastries',
      categoryId: 'cat-fun-money',
      date: todayStr,
      timestamp: Date.now() - 1000 * 60 * 60 * 48,
      weekId,
      monthId,
    },
    {
      id: 'tx-5',
      amount: 85.00,
      description: 'Home High-speed Internet Bill',
      categoryId: 'cat-bills',
      date: todayStr,
      timestamp: Date.now() - 1000 * 60 * 60 * 72,
      weekId,
      monthId,
    },
    {
      id: 'tx-6',
      amount: 15.99,
      description: 'Spotify Family Streaming plan',
      categoryId: 'cat-bills',
      date: todayStr,
      timestamp: Date.now() - 1000 * 60 * 60 * 96,
      weekId,
      monthId,
    },
    {
      id: 'tx-7',
      amount: 150.00,
      description: 'Weekly Auto-transfer to High-Yield Savings',
      categoryId: 'cat-savings',
      date: todayStr,
      timestamp: Date.now() - 1000 * 60 * 60 * 120,
      weekId,
      monthId,
    }
  ];
}
