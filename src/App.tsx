import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Receipt,
  Settings as SettingsIcon,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  User,
  Users,
  Download,
  Flame,
} from 'lucide-react';
import {
  AccountType,
  BudgetCategory,
  CalendarMode,
  CategorySummary,
  ExpenseItem,
  MonthlyRetrospective,
  UserConfig,
  WeeklyCheckInRecord,
} from './types';
import {
  DEFAULT_CATEGORIES,
  INITIAL_USER_CONFIG,
  formatCurrency,
  getCheckInStatus,
  getInitialExpenses,
  getMonthId,
  getRemainingWeeksInMonth,
  getSimulatedDate,
  getWeekId,
  getWeekRangeDisplay,
} from './utils/budgetUtils';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { CategoryCard } from './components/CategoryCard';
import { LogExpenseModal } from './components/LogExpenseModal';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { WeeklyCheckInModal } from './components/WeeklyCheckInModal';
import { MonthlyReviewModal } from './components/MonthlyReviewModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEYS = {
  USER_CONFIG: 'sb_user_config_v1',
  CATEGORIES: 'sb_categories_v1',
  EXPENSES: 'sb_expenses_v1',
  CHECK_INS: 'sb_checkins_v1',
  RETROSPECTIVES: 'sb_retrospectives_v1',
};

export default function App() {
  // Persistence state initialization
  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
      return saved ? JSON.parse(saved) : INITIAL_USER_CONFIG;
    } catch {
      return INITIAL_USER_CONFIG;
    }
  });

  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : getInitialExpenses();
    } catch {
      return getInitialExpenses();
    }
  });

  const [checkIns, setCheckIns] = useState<WeeklyCheckInRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [retrospectives, setRetrospectives] = useState<MonthlyRetrospective[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RETROSPECTIVES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Navigation & View states
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions'>('dashboard');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isMonthlyReviewOpen, setIsMonthlyReviewOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!userConfig.isOnboarded);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(userConfig));
  }, [userConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RETROSPECTIVES, JSON.stringify(retrospectives));
  }, [retrospectives]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Date and Time Calculations
  const simulatedDate = useMemo(() => {
    return getSimulatedDate(userConfig.simulationDayOffset || 0);
  }, [userConfig.simulationDayOffset]);

  const currentWeekId = useMemo(() => getWeekId(simulatedDate), [simulatedDate]);
  const currentMonthId = useMemo(() => getMonthId(simulatedDate), [simulatedDate]);
  const weekRange = useMemo(() => getWeekRangeDisplay(simulatedDate), [simulatedDate]);

  // Filter expenses by current timeframe
  const filteredExpensesForTimeframe = useMemo(() => {
    if (timeframe === 'week') {
      return expenses.filter(e => e.weekId === currentWeekId);
    }
    return expenses.filter(e => e.monthId === currentMonthId);
  }, [expenses, timeframe, currentWeekId, currentMonthId]);

  // Timeframe multiplier (Weeks in month vs Single week)
  const timeframeMultiplier = timeframe === 'month' ? 4.33 : 1;

  // Check-In Status Check
  const isCompletedThisWeek = useMemo(() => {
    return checkIns.some(c => c.weekId === currentWeekId);
  }, [checkIns, currentWeekId]);

  const checkInStatus = useMemo(() => {
    return getCheckInStatus(simulatedDate, isCompletedThisWeek);
  }, [simulatedDate, isCompletedThisWeek]);

  // Compute category summaries for the summary dashboard
  const categorySummaries: CategorySummary[] = useMemo(() => {
    return categories.map(cat => {
      const budgetSet = Math.round((cat.currentWeeklyBudget * timeframeMultiplier) * 100) / 100;
      const catExpenses = filteredExpensesForTimeframe.filter(e => e.categoryId === cat.id);
      const totalLogged = catExpenses.reduce((acc, curr) => acc + curr.amount, 0);
      const remaining = Math.round((budgetSet - totalLogged) * 100) / 100;
      const transactionCount = catExpenses.length;
      const percentSpent = budgetSet > 0 ? (totalLogged / budgetSet) * 100 : 0;
      const isOverspent = totalLogged > budgetSet;

      return {
        category: cat,
        budgetSet,
        totalLogged,
        remaining,
        transactionCount,
        percentSpent,
        isOverspent,
      };
    });
  }, [categories, filteredExpensesForTimeframe, timeframeMultiplier]);

  // Overall financial totals
  const totalBudgetPool = useMemo(() => {
    return Math.round(
      (timeframe === 'week' ? userConfig.weeklyIncomePool : userConfig.weeklyIncomePool * 4.33) * 100
    ) / 100;
  }, [userConfig.weeklyIncomePool, timeframe]);

  const totalSpentAll = useMemo(() => {
    return filteredExpensesForTimeframe.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpensesForTimeframe]);

  const totalRemainingPool = Math.round((totalBudgetPool - totalSpentAll) * 100) / 100;
  const overallPercentSpent = totalBudgetPool > 0 ? Math.round((totalSpentAll / totalBudgetPool) * 100) : 0;
  const isOverallOverspent = totalSpentAll > totalBudgetPool;

  // Handlers
  const handleOpenCategoryDrillDown = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActiveView('transactions');
  };

  const handleConfirmLoggedExpenses = (newItems: { amount: number; description: string; categoryId: string }[]) => {
    const todayStr = simulatedDate.toISOString().split('T')[0];
    const newExpenses: ExpenseItem[] = newItems.map((item, idx) => ({
      id: `exp-${Date.now()}-${idx}`,
      amount: item.amount,
      description: item.description,
      categoryId: item.categoryId,
      date: todayStr,
      timestamp: Date.now() + idx,
      weekId: currentWeekId,
      monthId: currentMonthId,
    }));

    setExpenses(prev => [...newExpenses, ...prev]);
    const totalAdded = newItems.reduce((a, b) => a + b.amount, 0);
    setToastMessage(`✓ Logged ${newItems.length} expense${newItems.length === 1 ? '' : 's'} (${formatCurrency(totalAdded)})`);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setToastMessage('Expense deleted');
  };

  const handleEditExpense = (updated: ExpenseItem) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    setToastMessage('Expense updated');
  };

  const handleCompleteCheckIn = (
    _surplusDecision: 'savings' | 'rollover' | 'none',
    updatedCategories: BudgetCategory[],
    record: WeeklyCheckInRecord
  ) => {
    setCategories(updatedCategories);
    setCheckIns(prev => [record, ...prev]);
    setToastMessage('Weekly check-in logged and budgets realigned!');
  };

  const handleExecuteHardReset = (retro: MonthlyRetrospective, resetCategories: BudgetCategory[]) => {
    setCategories(resetCategories);
    setRetrospectives(prev => [retro, ...prev]);
    setToastMessage('Hard reset complete! Baseline budgets restored for new month.');
  };

  const handleResetAllData = () => {
    if (confirm('Reset all transactions and budget settings to clean default values?')) {
      setUserConfig(INITIAL_USER_CONFIG);
      setCategories(DEFAULT_CATEGORIES);
      setExpenses(getInitialExpenses());
      setCheckIns([]);
      setRetrospectives([]);
      setToastMessage('Data reset to defaults');
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#2D3E33] flex flex-col pb-20 md:pb-8 selection:bg-[#849681]/25">
      {/* Top Navigation */}
      <Navbar
        userConfig={userConfig}
        timeframe={timeframe}
        onTimeframeToggle={setTimeframe}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCheckIn={() => setIsCheckInModalOpen(true)}
        onOpenMonthlyReview={() => setIsMonthlyReviewOpen(true)}
        isCheckInActive={checkInStatus.isActive}
        isPastDue={checkInStatus.isPastDue}
        simulatedDate={simulatedDate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* VIEW 1: Summary Dashboard ("My Budget") */}
        {activeView === 'dashboard' ? (
          <div className="space-y-6">
            {/* Desktop / Multi-Column Enhanced Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left/Main Column: Financial Banner, Category Cards Grid */}
              <div className="lg:col-span-8 space-y-6">
                {/* Top Financial Health Overview Banner */}
                <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs transition-all ${
                  isOverallOverspent
                    ? 'bg-[#FFF8F8] border-[#D9383A]/30'
                    : 'bg-white border-[#E8E1D5]'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A9A87] block">
                        {timeframe === 'week' ? 'Weekly Spending Pool' : 'Monthly Spending Pool'}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E2D24]">
                          {formatCurrency(totalSpentAll)}
                        </h2>
                        <span className="text-xs sm:text-sm font-semibold text-[#748771]">
                          of {formatCurrency(totalBudgetPool)}
                        </span>
                      </div>
                    </div>

                    {/* Single prominent "Log Expense" CTA Button */}
                    <button
                      id="dashboard-primary-log-cta"
                      onClick={() => setIsLogModalOpen(true)}
                      className="px-5 py-3 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow-md"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      Log Expense
                    </button>
                  </div>

                  {/* Progress Bar & Health Status */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#748771]">
                        {overallPercentSpent}% Spent • {filteredExpensesForTimeframe.length} logged item{filteredExpensesForTimeframe.length === 1 ? '' : 's'}
                      </span>
                      <span className={isOverallOverspent ? 'text-[#D9383A] font-bold' : 'text-[#3B6E38] font-bold'}>
                        {isOverallOverspent
                          ? `Over budget by ${formatCurrency(Math.abs(totalRemainingPool))}`
                          : `${formatCurrency(totalRemainingPool)} remaining`}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-[#EBE6DC] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isOverallOverspent
                            ? 'bg-[#D9383A]'
                            : overallPercentSpent > 85
                            ? 'bg-[#C78736]'
                            : 'bg-[#5B7A58]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, overallPercentSpent))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* WEEKLY CHECK-IN BANNER & ALERT */}
                {(checkInStatus.isActive || checkInStatus.isPastDue) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                      checkInStatus.isPastDue
                        ? 'bg-[#FFF5F5] border-[#D9383A]/40'
                        : 'bg-[#EAF0E9] border-[#C6D7C4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        checkInStatus.isPastDue ? 'bg-[#D9383A] text-white animate-pulse' : 'bg-[#3B6E38] text-white'
                      }`}>
                        {checkInStatus.isPastDue ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${checkInStatus.isPastDue ? 'text-[#D9383A]' : 'text-[#1E2D24]'}`}>
                          {checkInStatus.isPastDue ? 'PAST-DUE CHECK-IN ALERT' : 'Weekly Accountability Check-In Ready'}
                        </h3>
                        <p className="text-xs text-[#5C7257] mt-0.5">
                          {checkInStatus.message}
                        </p>
                      </div>
                    </div>

                    <button
                      id="active-checkin-banner-btn"
                      onClick={() => setIsCheckInModalOpen(true)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                        checkInStatus.isPastDue
                          ? 'bg-[#D9383A] hover:bg-[#C22E30] text-white ring-2 ring-[#D9383A]/30'
                          : 'bg-[#3B6E38] hover:bg-[#2F592C] text-white'
                      }`}
                    >
                      {checkInStatus.isPastDue ? 'Complete Past-Due Check-In' : 'Start Weekly Check-In'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {/* Category Cards Section Header */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h2 className="text-base font-bold text-[#1E2D24]">Budget Categories</h2>
                    <p className="text-xs text-[#748771]">
                      Click any category card to drill down into its transaction history
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#8A9A87]">
                    {categories.length} Categories
                  </span>
                </div>

                {/* CATEGORY CARDS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categorySummaries.map(summary => (
                    <CategoryCard
                      key={summary.category.id}
                      summary={summary}
                      timeframe={timeframe}
                      multiplier={timeframeMultiplier}
                      onSelectCategory={handleOpenCategoryDrillDown}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column (Desktop Sidebar / Tablet Info Panel) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Account & Budget Info Widget */}
                <div className="p-5 bg-white rounded-3xl border border-[#E8E1D5] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#EAF0E9] text-[#2D3E33] flex items-center justify-center font-bold text-xs">
                        {userConfig.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1E2D24]">{userConfig.name}</h4>
                        <p className="text-[10px] text-[#748771] capitalize">
                          {userConfig.accountType} budget {userConfig.roommatesCount ? `(${userConfig.roommatesCount} roommates)` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-[11px] font-semibold text-[#5B7A58] hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#748771]">
                      <span>Calendar System:</span>
                      <strong className="text-[#2D3E33]">
                        {userConfig.calendarMode === 'weekly' ? 'Fiscal Weekly' : 'Calendar Month'}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#748771]">
                      <span>Income Schedule:</span>
                      <strong className="text-[#2D3E33] capitalize">
                        {formatCurrency(userConfig.rawIncome)} ({userConfig.paySchedule})
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#748771]">
                      <span>Unified Weekly Pool:</span>
                      <strong className="text-[#2D3E33] font-bold">
                        {formatCurrency(userConfig.weeklyIncomePool)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Recent Logged Activity Snippet */}
                <div className="p-5 bg-white rounded-3xl border border-[#E8E1D5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#1E2D24] flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#7C5E45]" />
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedCategoryId('all');
                        setActiveView('transactions');
                      }}
                      className="text-[11px] font-bold text-[#5B7A58] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {expenses.slice(0, 4).map(exp => {
                      const cat = categories.find(c => c.id === exp.categoryId);
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#FBF9F5] border border-[#F2ECE1] text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-[#1E2D24] block truncate">
                              {exp.description}
                            </span>
                            <span className="text-[10px] text-[#748771]">
                              {cat?.name || 'Expense'} • {exp.date}
                            </span>
                          </div>
                          <span className="font-bold text-[#2D3E33] shrink-0">
                            {formatCurrency(exp.amount)}
                          </span>
                        </div>
                      );
                    })}

                    {expenses.length === 0 && (
                      <p className="text-xs text-[#748771] text-center py-4">
                        No expenses logged yet. Tap Log Expense to begin!
                      </p>
                    )}
                  </div>
                </div>

                {/* End of Month Hard Reset Banner */}
                <div className="p-5 bg-[#F5EFE6] rounded-3xl border border-[#E0D7C9] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#7C5E45]" />
                    <h3 className="text-xs font-bold text-[#2D3E33]">Monthly Retrospective</h3>
                  </div>
                  <p className="text-[11px] text-[#5C4430] leading-relaxed">
                    Review monthly spending trends and execute a clean Hard Reset to start fresh without prior month deficits.
                  </p>
                  <button
                    id="open-monthly-retro-btn"
                    onClick={() => setIsMonthlyReviewOpen(true)}
                    className="w-full py-2 bg-white hover:bg-[#EAE3D5] text-[#2D3E33] border border-[#DCD3C5] rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    Open Monthly Review & Hard Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: Category Drill-Down & Transaction History Page */
          <TransactionHistoryView
            selectedCategoryId={selectedCategoryId}
            categories={categories}
            expenses={filteredExpensesForTimeframe}
            timeframe={timeframe}
            onSelectCategoryTab={setSelectedCategoryId}
            onBackToDashboard={() => setActiveView('dashboard')}
            onDeleteExpense={handleDeleteExpense}
            onEditExpense={handleEditExpense}
            onOpenLogModal={() => setIsLogModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={activeView === 'dashboard' ? 'dashboard' : 'transactions'}
        onSelectTab={(tab) => {
          if (tab === 'dashboard') setActiveView('dashboard');
          else if (tab === 'transactions') {
            setSelectedCategoryId('all');
            setActiveView('transactions');
          } else if (tab === 'settings') {
            setIsSettingsOpen(true);
          }
        }}
        onOpenLogExpense={() => setIsLogModalOpen(true)}
        onOpenCheckIn={() => setIsCheckInModalOpen(true)}
        isCheckInActive={checkInStatus.isActive}
        isPastDue={checkInStatus.isPastDue}
      />

      {/* MODALS */}
      {/* 1. Dual-Path Expense Logging Modal */}
      <LogExpenseModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        categories={categories}
        activeTabPreference={userConfig.activeTabPreference || 'ai'}
        onUpdateTabPreference={(tab) => setUserConfig(prev => ({ ...prev, activeTabPreference: tab }))}
        onConfirmExpenses={handleConfirmLoggedExpenses}
      />

      {/* 2. Weekly Check-In Modal */}
      <WeeklyCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        categories={categories}
        expensesThisWeek={expenses.filter(e => e.weekId === currentWeekId)}
        weeklyIncomePool={userConfig.weeklyIncomePool}
        simulatedDate={simulatedDate}
        isPastDue={checkInStatus.isPastDue}
        onCompleteCheckIn={handleCompleteCheckIn}
      />

      {/* 3. Monthly Retrospective & Hard Reset Modal */}
      <MonthlyReviewModal
        isOpen={isMonthlyReviewOpen}
        onClose={() => setIsMonthlyReviewOpen(false)}
        categories={categories}
        expenses={expenses.filter(e => e.monthId === currentMonthId)}
        monthlyIncome={userConfig.weeklyIncomePool * 4.33}
        simulatedDate={simulatedDate}
        onExecuteHardReset={handleExecuteHardReset}
      />

      {/* 4. Onboarding / Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={(newConfig, newCategories) => {
          setUserConfig(newConfig);
          setCategories(newCategories);
          setIsOnboardingOpen(false);
          setToastMessage('Welcome to Simple Budgeting!');
        }}
      />

      {/* 5. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userConfig={userConfig}
        categories={categories}
        onSaveConfig={(updatedConfig, updatedCats) => {
          setUserConfig(updatedConfig);
          setCategories(updatedCats);
          setToastMessage('Settings saved');
        }}
        onResetAllData={handleResetAllData}
        onOpenOnboarding={() => {
          setIsSettingsOpen(false);
          setIsOnboardingOpen(true);
        }}
      />

      {/* Non-intrusive Confirmation Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#2D3E33] text-white text-xs font-bold rounded-2xl shadow-lg border border-[#3E5244] flex items-center gap-2 max-w-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#A5C9A1] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
