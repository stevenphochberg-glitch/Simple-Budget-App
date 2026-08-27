export type AccountType = 'single' | 'couple' | 'family' | 'roommate';
export type PaySchedule = 'weekly' | 'bi-weekly' | 'monthly';
export type CalendarMode = 'weekly' | 'monthly';

export interface UserConfig {
  name: string;
  email?: string;
  accountType: AccountType;
  roommatesCount?: number;
  rawIncome: number;
  paySchedule: PaySchedule;
  weeklyIncomePool: number;
  calendarMode: CalendarMode;
  isOnboarded: boolean;
  activeTabPreference: 'ai' | 'manual';
  simulationDayOffset: number; // For demo/testing weekly check-in active/past-due state
}

export interface BudgetCategory {
  id: string;
  name: string;
  key?: 'essentials' | 'fun_money' | 'bills' | 'savings' | 'custom';
  baselineWeeklyBudget: number; // The persistent monthly baseline
  currentWeeklyBudget: number;  // Current week's adjusted budget (after rollovers / overspend adjustments)
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
  examples: string[];
}

export interface ExpenseItem {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  weekId: string; // e.g. "2026-W35"
  monthId: string; // e.g. "2026-08"
}

export interface StagingExpense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  confidence?: string;
}

export interface WeeklyCheckInRecord {
  id: string;
  weekId: string;
  weekLabel: string;
  completedAt: string;
  totalSpent: number;
  totalBudget: number;
  surplusMovedToSavings: number;
  rolloversProrated: { categoryId: string; amountProratedPerWeek: number }[];
  overspendingAdjustments: { categoryId: string; weeklyDeduction: number }[];
  reflection?: string;
}

export interface MonthlyRetrospective {
  monthId: string;
  monthLabel: string;
  completedAt: string;
  totalIncome: number;
  totalSpent: number;
  totalSaved: number;
  intentions: string;
}

export interface CategorySummary {
  category: BudgetCategory;
  budgetSet: number;
  totalLogged: number;
  remaining: number;
  transactionCount: number;
  percentSpent: number;
  isOverspent: boolean;
}
