import React, { useState } from 'react';
import { User, Users, Home, Heart, Shield, DollarSign, Calendar, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { AccountType, BudgetCategory, CalendarMode, PaySchedule, UserConfig } from '../types';
import { formatCurrency, normalizeToWeeklyIncome } from '../utils/budgetUtils';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (userConfig: UserConfig, baselineCategories: BudgetCategory[]) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [page, setPage] = useState<'login' | 'wizard'>('login');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Login form state
  const [email, setEmail] = useState('alex@simplebudget.app');
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Alex Rivera');

  // Wizard state
  const [accountType, setAccountType] = useState<AccountType>('couple');
  const [roommatesCount, setRoommatesCount] = useState<number>(2);
  const [rawIncome, setRawIncome] = useState<number>(5200);
  const [paySchedule, setPaySchedule] = useState<PaySchedule>('monthly');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('weekly');

  // Category Baseline allocations
  const calculatedWeeklyPool = normalizeToWeeklyIncome(rawIncome, paySchedule);

  const [categoryBudgets, setCategoryBudgets] = useState<{ [id: string]: number }>({
    'cat-essentials': 420,
    'cat-fun-money': 180,
    'cat-bills': 350,
    'cat-savings': 250,
  });

  const totalAllocated = (Object.values(categoryBudgets) as number[]).reduce((a: number, b: number) => a + b, 0);
  const unallocatedAmount = calculatedWeeklyPool - totalAllocated;

  const handleUpdateCategoryBudget = (catId: string, valueStr: string) => {
    const val = Math.max(0, parseFloat(valueStr) || 0);
    setCategoryBudgets(prev => ({
      ...prev,
      [catId]: val,
    }));
  };

  const handleFinishWizard = () => {
    const userConfig: UserConfig = {
      name: name.trim() || 'Alex Rivera',
      email: email.trim(),
      accountType,
      roommatesCount: accountType === 'roommate' ? roommatesCount : undefined,
      rawIncome,
      paySchedule,
      weeklyIncomePool: calculatedWeeklyPool,
      calendarMode,
      isOnboarded: true,
      activeTabPreference: 'ai',
      simulationDayOffset: 0,
    };

    const initialCategories: BudgetCategory[] = [
      {
        id: 'cat-essentials',
        name: 'Essentials',
        key: 'essentials',
        baselineWeeklyBudget: categoryBudgets['cat-essentials'] || 400,
        currentWeeklyBudget: categoryBudgets['cat-essentials'] || 400,
        color: '#5B7A58',
        bgColor: '#EAF0E9',
        borderColor: '#C6D7C4',
        iconName: 'ShoppingBag',
        description: 'Groceries, Gas, personal goods, home goods',
        examples: ['Groceries', 'Gas', 'Pharmacy', 'Home Goods']
      },
      {
        id: 'cat-fun-money',
        name: 'Fun Money',
        key: 'fun_money',
        baselineWeeklyBudget: categoryBudgets['cat-fun-money'] || 180,
        currentWeeklyBudget: categoryBudgets['cat-fun-money'] || 180,
        color: '#4B7B9E',
        bgColor: '#E6F0FA',
        borderColor: '#C2D9EE',
        iconName: 'Coffee',
        description: 'Restaurants, Shopping, recreation',
        examples: ['Restaurants', 'Coffee', 'Shopping', 'Entertainment']
      },
      {
        id: 'cat-bills',
        name: 'Bills',
        key: 'bills',
        baselineWeeklyBudget: categoryBudgets['cat-bills'] || 350,
        currentWeeklyBudget: categoryBudgets['cat-bills'] || 350,
        color: '#7C5E45',
        bgColor: '#F5EFEA',
        borderColor: '#DDD0C4',
        iconName: 'Receipt',
        description: 'Subscriptions, mortgage/rent, utilities, fixed spending',
        examples: ['Rent / Mortgage', 'Utilities', 'Cell Phone', 'Subscriptions']
      },
      {
        id: 'cat-savings',
        name: 'Savings',
        key: 'savings',
        baselineWeeklyBudget: categoryBudgets['cat-savings'] || 250,
        currentWeeklyBudget: categoryBudgets['cat-savings'] || 250,
        color: '#2D3E33',
        bgColor: '#E8ECE9',
        borderColor: '#BFCBC3',
        iconName: 'PiggyBank',
        description: 'Downpayment, daycare fund, Investing',
        examples: ['Emergency Fund', 'Downpayment', 'Daycare', 'Investments']
      }
    ];

    onComplete(userConfig, initialCategories);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2D24]/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#E8E1D5] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* PAGE 1: Login & Marketing */}
        {page === 'login' ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#2D3E33] text-white flex items-center justify-center mx-auto shadow-xs font-bold text-xl">
                SB
              </div>
              <h1 className="text-2xl font-extrabold text-[#1E2D24]">Simple Budgeting</h1>
              <p className="text-xs text-[#5C7257] max-w-xs mx-auto">
                Foster healthy financial habits and prevent overspending with frictionless manual logging & weekly accountability.
              </p>
            </div>

            {/* Marketing Value Props */}
            <div className="p-4 bg-[#F5EFE6] rounded-2xl border border-[#E0D7C9] space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#5B7A58] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-xs text-[#3E5244]">
                  <strong>Shared or Solo Finances:</strong> Built for singles, couples, families, and roommates.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#5B7A58] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-xs text-[#3E5244]">
                  <strong>Dual-Path Frictionless Logging:</strong> AI-powered compound notes or quick manual batches.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#5B7A58] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </div>
                <p className="text-xs text-[#3E5244]">
                  <strong>Weekly Check-In Rollovers:</strong> Dynamic realignments that keep you on budget.
                </p>
              </div>
            </div>

            {/* Standard Login Controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                  Full Name / Household Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex & Jordan"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCD3C5] rounded-xl text-xs text-[#2D3E33] focus:ring-2 focus:ring-[#5B7A58] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCD3C5] rounded-xl text-xs text-[#2D3E33] focus:ring-2 focus:ring-[#5B7A58] outline-none"
                />
              </div>
            </div>

            {/* CTA to start wizard */}
            <div className="space-y-2 pt-2">
              <button
                id="start-setup-wizard-btn"
                onClick={() => setPage('wizard')}
                className="w-full py-3.5 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                Continue to Account Setup Wizard
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="quick-demo-login-btn"
                onClick={handleFinishWizard}
                className="w-full py-2.5 bg-transparent hover:bg-[#EAE3D5] text-[#5C7257] rounded-xl text-xs font-semibold transition-colors"
              >
                Instant Demo Access (Use Defaults)
              </button>
            </div>
          </div>
        ) : (
          /* SETUP WIZARD (TUTORIAL FLOW) */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* Wizard progress bar */}
            <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#8A9A87] uppercase tracking-wider">
                  Setup Wizard — Step {wizardStep} of 3
                </span>
                <h2 className="text-base font-bold text-[#1E2D24]">
                  {wizardStep === 1 && 'Account Structure'}
                  {wizardStep === 2 && 'Income Normalization & Calendar'}
                  {wizardStep === 3 && 'Category Budget Allocation'}
                </h2>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    className={`w-5 h-1.5 rounded-full ${wizardStep >= s ? 'bg-[#5B7A58]' : 'bg-[#D8CEBE]'}`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Account Type Selection */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-[#748771]">
                  Choose who this budget is designed for:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'single' as AccountType, label: 'Single-person', icon: User, desc: 'Solo financial goals' },
                    { type: 'couple' as AccountType, label: 'Couple', icon: Heart, desc: 'Shared partner budget' },
                    { type: 'family' as AccountType, label: 'Family', icon: Home, desc: 'Household with kids' },
                    { type: 'roommate' as AccountType, label: 'Roommate', icon: Users, desc: 'Shared flat / house' },
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = accountType === item.type;
                    return (
                      <div
                        key={item.type}
                        id={`account-type-${item.type}`}
                        onClick={() => setAccountType(item.type)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#EAF0E9] border-[#5B7A58] ring-2 ring-[#5B7A58]/20'
                            : 'bg-white border-[#EBE6DC] hover:border-[#D8CEBE]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#5B7A58]' : 'text-[#748771]'}`} />
                          <span className="text-xs font-bold text-[#1E2D24]">{item.label}</span>
                        </div>
                        <p className="text-[10px] text-[#748771]">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Roommate Input */}
                {accountType === 'roommate' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 bg-[#F6F2EA] rounded-2xl border border-[#E0D7C9] space-y-1.5"
                  >
                    <label className="block text-xs font-semibold text-[#2D3E33]">
                      Exact Number of Roommates:
                    </label>
                    <input
                      id="roommates-count-input"
                      type="number"
                      min={1}
                      max={20}
                      value={roommatesCount}
                      onChange={(e) => setRoommatesCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-white border border-[#DCD3C5] rounded-xl text-xs font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#5B7A58] outline-none"
                    />
                  </motion.div>
                )}

                <button
                  onClick={() => setWizardStep(2)}
                  className="w-full py-3.5 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  Next: Income & Calendar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Income Input & Normalization & Calendar Architecture */}
            {wizardStep === 2 && (
              <div className="space-y-5">
                {/* Income Input */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#2D3E33]">
                    Household Take-Home Income:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'weekly' as PaySchedule, label: 'Weekly' },
                      { id: 'bi-weekly' as PaySchedule, label: 'Bi-Weekly' },
                      { id: 'monthly' as PaySchedule, label: 'Monthly' },
                    ].map(sched => (
                      <button
                        key={sched.id}
                        type="button"
                        onClick={() => setPaySchedule(sched.id)}
                        className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                          paySchedule === sched.id
                            ? 'bg-[#2D3E33] text-white border-[#2D3E33]'
                            : 'bg-white text-[#6C7B6A] border-[#E8E1D5]'
                        }`}
                      >
                        {sched.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#748771]">
                      $
                    </span>
                    <input
                      id="raw-income-input"
                      type="number"
                      value={rawIncome}
                      onChange={(e) => setRawIncome(parseFloat(e.target.value) || 0)}
                      placeholder="5200"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#DCD3C5] rounded-xl text-sm font-bold text-[#2D3E33] focus:ring-2 focus:ring-[#5B7A58] outline-none"
                    />
                  </div>

                  {/* Unified weekly pool preview */}
                  <div className="p-3 bg-[#EAF0E9] border border-[#C6D7C4] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[#5C7257] font-semibold">Unified Weekly Budget Pool:</span>
                    <span className="font-extrabold text-sm text-[#2D3E33]">
                      {formatCurrency(calculatedWeeklyPool)} / week
                    </span>
                  </div>
                </div>

                {/* Calendar Architecture Settings */}
                <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
                  <label className="block text-xs font-semibold text-[#2D3E33]">
                    Calendar Architecture System:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setCalendarMode('weekly')}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        calendarMode === 'weekly'
                          ? 'bg-[#EAF0E9] border-[#5B7A58] ring-2 ring-[#5B7A58]/20'
                          : 'bg-white border-[#EBE6DC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#1E2D24]">Fiscal Weekly</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#5B7A58] text-white rounded">
                          DEFAULT
                        </span>
                      </div>
                      <p className="text-[10px] text-[#748771]">
                        Structured weekly check-in intervals
                      </p>
                    </div>

                    <div
                      onClick={() => setCalendarMode('monthly')}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        calendarMode === 'monthly'
                          ? 'bg-[#EAF0E9] border-[#5B7A58] ring-2 ring-[#5B7A58]/20'
                          : 'bg-white border-[#EBE6DC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#1E2D24]">Calendar Month</span>
                      </div>
                      <p className="text-[10px] text-[#748771]">
                        1st to end-of-month tracking
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="py-3 px-4 bg-[#EAE3D5] text-[#2D3E33] rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setWizardStep(3)}
                    className="flex-1 py-3 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    Next: Category Budgets
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Budget Categories Baseline Allocations */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-[#748771]">
                    Available Weekly Pool: <strong>{formatCurrency(calculatedWeeklyPool)}</strong>
                  </span>
                  <span
                    className={`font-bold ${
                      unallocatedAmount < 0 ? 'text-[#D9383A]' : 'text-[#3B6E38]'
                    }`}
                  >
                    {unallocatedAmount >= 0 ? `${formatCurrency(unallocatedAmount)} unassigned` : `${formatCurrency(Math.abs(unallocatedAmount))} over pool!`}
                  </span>
                </div>

                {/* Categories */}
                <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
                  {[
                    { id: 'cat-essentials', name: 'Essentials', desc: 'Groceries, Gas, personal goods, home goods' },
                    { id: 'cat-fun-money', name: 'Fun Money', desc: 'Restaurants, Shopping' },
                    { id: 'cat-bills', name: 'Bills', desc: 'Subscriptions, rent, utilities, fixed' },
                    { id: 'cat-savings', name: 'Savings', desc: 'Downpayment, daycare fund, investing' },
                  ].map(cat => (
                    <div
                      key={cat.id}
                      className="p-3 bg-white border border-[#E8E1D5] rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#1E2D24]">{cat.name}</h4>
                          <p className="text-[10px] text-[#748771]">{cat.desc}</p>
                        </div>
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#748771]">
                            $
                          </span>
                          <input
                            type="number"
                            value={categoryBudgets[cat.id] || ''}
                            onChange={(e) => handleUpdateCategoryBudget(cat.id, e.target.value)}
                            className="w-full pl-5 pr-2 py-1 text-xs bg-[#FBF9F5] border border-[#DCD3C5] rounded-lg text-right font-bold text-[#2D3E33] focus:ring-1 focus:ring-[#5B7A58] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {unallocatedAmount < 0 && (
                  <p className="text-xs text-[#D9383A] font-semibold">
                    ⚠️ Total category allocations cannot exceed your calculated weekly income pool ({formatCurrency(calculatedWeeklyPool)}).
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="py-3 px-4 bg-[#EAE3D5] text-[#2D3E33] rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    id="finish-onboarding-btn"
                    disabled={unallocatedAmount < 0}
                    onClick={handleFinishWizard}
                    className="flex-1 py-3.5 bg-[#3B6E38] hover:bg-[#2F592C] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    Complete Setup & Open Budget
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
