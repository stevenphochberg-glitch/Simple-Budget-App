import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, TrendingUp, Sparkles, X, ChevronRight, PieChart } from 'lucide-react';
import { BudgetCategory, ExpenseItem, WeeklyCheckInRecord } from '../types';
import { formatCurrency, getRemainingWeeksInMonth } from '../utils/budgetUtils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface WeeklyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  expensesThisWeek: ExpenseItem[];
  weeklyIncomePool: number;
  simulatedDate: Date;
  isPastDue: boolean;
  onCompleteCheckIn: (
    surplusDecision: 'savings' | 'rollover' | 'none',
    updatedCategories: BudgetCategory[],
    record: WeeklyCheckInRecord
  ) => void;
}

export const WeeklyCheckInModal: React.FC<WeeklyCheckInModalProps> = ({
  isOpen,
  onClose,
  categories,
  expensesThisWeek,
  weeklyIncomePool,
  simulatedDate,
  isPastDue,
  onCompleteCheckIn,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Review, 2: Surplus/Deficit Adjustment, 3: Success
  const [surplusOption, setSurplusOption] = useState<'savings' | 'rollover'>('savings');
  const [reflectionNote, setReflectionNote] = useState('');

  // Calculate category balances for the week
  const categoryStats = categories.map(cat => {
    const spent = expensesThisWeek
      .filter(e => e.categoryId === cat.id)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const budget = cat.currentWeeklyBudget;
    const diff = budget - spent;
    return {
      category: cat,
      budget,
      spent,
      diff,
      isOverspent: diff < 0,
      isUnderspent: diff > 0,
    };
  });

  const totalSpent = categoryStats.reduce((acc, curr) => acc + curr.spent, 0);
  const totalBudget = categoryStats.reduce((acc, curr) => acc + curr.budget, 0);
  const netDifference = totalBudget - totalSpent; // > 0 means surplus, < 0 means deficit

  const underspentCategories = categoryStats.filter(c => c.isUnderspent && c.category.key !== 'savings');
  const totalUnderspentSurplus = underspentCategories.reduce((acc, curr) => acc + curr.diff, 0);

  const overspentCategories = categoryStats.filter(c => c.isOverspent);
  const totalOverspentDeficit = overspentCategories.reduce((acc, curr) => acc + Math.abs(curr.diff), 0);

  const remainingWeeks = getRemainingWeeksInMonth(simulatedDate);

  const handleFinishCheckIn = () => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#849681', '#6B9AC4', '#7C5E45', '#2D3E33']
      });
    } catch {
      // safe fallback
    }

    // Apply adjustments
    const updatedCategories = categories.map(cat => {
      let newCurrentBudget = cat.baselineWeeklyBudget;
      const stat = categoryStats.find(s => s.category.id === cat.id);

      if (!stat) return cat;

      // If category was OVERSPENT: adjust future weekly budgets DOWN to absorb deficit across remaining weeks
      if (stat.isOverspent) {
        const weeklyDeduction = Math.abs(stat.diff) / remainingWeeks;
        newCurrentBudget = Math.max(0, Math.round((cat.baselineWeeklyBudget - weeklyDeduction) * 100) / 100);
      }
      // If user chose ROLLOVER and category was UNDERSPENT: distribute surplus evenly across remaining weeks
      else if (surplusOption === 'rollover' && stat.isUnderspent && cat.key !== 'savings') {
        const weeklyAddition = stat.diff / remainingWeeks;
        newCurrentBudget = Math.round((cat.baselineWeeklyBudget + weeklyAddition) * 100) / 100;
      }
      // If user chose MOVE TO SAVINGS: increase savings category budget / pot
      else if (surplusOption === 'savings' && cat.key === 'savings') {
        newCurrentBudget = Math.round((cat.baselineWeeklyBudget + totalUnderspentSurplus) * 100) / 100;
      }

      return {
        ...cat,
        currentWeeklyBudget: newCurrentBudget,
      };
    });

    const checkInRecord: WeeklyCheckInRecord = {
      id: `checkin-${Date.now()}`,
      weekId: `week-${Date.now()}`,
      weekLabel: `Week ending ${simulatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      completedAt: new Date().toISOString(),
      totalSpent,
      totalBudget,
      surplusMovedToSavings: surplusOption === 'savings' ? totalUnderspentSurplus : 0,
      rolloversProrated: surplusOption === 'rollover'
        ? underspentCategories.map(c => ({ categoryId: c.category.id, amountProratedPerWeek: c.diff / remainingWeeks }))
        : [],
      overspendingAdjustments: overspentCategories.map(c => ({
        categoryId: c.category.id,
        weeklyDeduction: Math.abs(c.diff) / remainingWeeks,
      })),
      reflection: reflectionNote.trim(),
    };

    onCompleteCheckIn(surplusOption, updatedCategories, checkInRecord);
    setStep(3);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2D24]/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#E8E1D5] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isPastDue ? 'bg-[#FDF2F2] border-[#F5C2C2]' : 'bg-[#F5EFE6] border-[#E6DDD0]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isPastDue ? 'bg-[#D9383A] text-white' : 'bg-[#2D3E33] text-white'
            }`}>
              {isPastDue ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E2D24]">
                {isPastDue ? 'Past-Due Weekly Check-In' : 'Weekly Accountability Check-In'}
              </h2>
              <p className="text-xs text-[#748771]">
                Step {step} of 2 • Reconcile spending & realign next week
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#748771] hover:text-[#2D3E33] hover:bg-[#EAE3D5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Expense Review */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#F6F2EA] p-4 rounded-2xl border border-[#E8E1D5] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#748771] font-semibold">Total Weekly Budget:</span>
                  <span className="font-bold text-[#2D3E33]">{formatCurrency(totalBudget)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#748771] font-semibold">Total Spent This Week:</span>
                  <span className={`font-bold ${netDifference < 0 ? 'text-[#D9383A]' : 'text-[#2D3E33]'}`}>
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#DFD6C8] flex justify-between items-center">
                  <span className="text-xs font-bold text-[#2D3E33]">
                    {netDifference >= 0 ? 'Net Weekly Surplus:' : 'Net Weekly Deficit:'}
                  </span>
                  <span className={`text-sm font-extrabold ${netDifference >= 0 ? 'text-[#3B6E38]' : 'text-[#D9383A]'}`}>
                    {formatCurrency(Math.abs(netDifference))}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#748771] uppercase tracking-wider">
                  Category Breakdown
                </h3>
                {categoryStats.map(stat => (
                  <div
                    key={stat.category.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      stat.isOverspent
                        ? 'bg-[#FFF8F8] border-[#D9383A]/30'
                        : 'bg-white border-[#EBE6DC]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#1E2D24]">{stat.category.name}</h4>
                      <p className="text-[11px] text-[#748771]">
                        Spent {formatCurrency(stat.spent)} of {formatCurrency(stat.budget)}
                      </p>
                    </div>
                    <div className="text-right">
                      {stat.isOverspent ? (
                        <span className="text-xs font-bold text-[#D9383A]">
                          +{formatCurrency(Math.abs(stat.diff))} over
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#3B6E38]">
                          {formatCurrency(stat.diff)} left
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                id="checkin-next-step-btn"
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                Proceed to Rollover & Balance Adjustments
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Underspending & Overspending Actions */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Underspending Surplus Decision */}
              {totalUnderspentSurplus > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#2D3E33] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#5B7A58]" />
                      Underspending Surplus: {formatCurrency(totalUnderspentSurplus)}
                    </h3>
                  </div>
                  <p className="text-xs text-[#748771]">
                    You came under budget! Choose how you'd like to allocate your leftover funds:
                  </p>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Option 1: Move to Savings */}
                    <div
                      onClick={() => setSurplusOption('savings')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        surplusOption === 'savings'
                          ? 'bg-[#EAF0E9] border-[#5B7A58] ring-2 ring-[#5B7A58]/20'
                          : 'bg-white border-[#EBE6DC] hover:border-[#D8CEBE]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={surplusOption === 'savings'}
                            onChange={() => setSurplusOption('savings')}
                            className="accent-[#5B7A58]"
                          />
                          <span className="text-xs font-bold text-[#1E2D24]">
                            Move Surplus to Savings
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#5B7A58] text-white rounded-full">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C7257] pl-5">
                        Immediately locks in your financial victory and builds your savings cushion.
                      </p>
                    </div>

                    {/* Option 2: Rollover / Prorate */}
                    <div
                      onClick={() => setSurplusOption('rollover')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        surplusOption === 'rollover'
                          ? 'bg-[#EAF0E9] border-[#5B7A58] ring-2 ring-[#5B7A58]/20'
                          : 'bg-white border-[#EBE6DC] hover:border-[#D8CEBE]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          checked={surplusOption === 'rollover'}
                          onChange={() => setSurplusOption('rollover')}
                          className="accent-[#5B7A58]"
                        />
                        <span className="text-xs font-bold text-[#1E2D24]">
                          Rollover / Prorate across remaining weeks
                        </span>
                      </div>
                      <p className="text-[11px] text-[#748771] pl-5">
                        Distributes {formatCurrency(totalUnderspentSurplus)} evenly across the remaining {remainingWeeks} week{remainingWeeks === 1 ? '' : 's'} of this month (+{formatCurrency(totalUnderspentSurplus / remainingWeeks)}/wk).
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#F6F2EA] rounded-xl text-xs text-[#748771]">
                  No underspent category surplus for this check-in cycle.
                </div>
              )}

              {/* Overspending Absorption Logic */}
              {overspentCategories.length > 0 && (
                <div className="p-3.5 bg-[#FFF8F8] border border-[#D9383A]/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-[#D9383A]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <h3 className="text-xs font-bold">
                      Automatic Overspending Absorption ({formatCurrency(totalOverspentDeficit)})
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#7A4041] leading-relaxed">
                    To keep your month balanced, future weekly budgets for overspent categories will be reduced by{' '}
                    <strong>{formatCurrency(totalOverspentDeficit / remainingWeeks)}/week</strong> across the remaining {remainingWeeks} week{remainingWeeks === 1 ? '' : 's'}.
                  </p>
                </div>
              )}

              {/* Optional Reflection Note */}
              <div>
                <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                  Weekly Reflection / Win / Lesson (Optional):
                </label>
                <input
                  type="text"
                  value={reflectionNote}
                  onChange={(e) => setReflectionNote(e.target.value)}
                  placeholder="e.g. Cooked more meals at home, kept gas expenses down."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DCD3C5] rounded-xl text-[#2D3E33] focus:ring-2 focus:ring-[#5B7A58] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 bg-[#EAE3D5] hover:bg-[#DDD3C2] text-[#2D3E33] rounded-xl text-xs font-semibold transition-colors"
                >
                  Back to Review
                </button>
                <button
                  id="complete-checkin-confirm-btn"
                  type="button"
                  onClick={handleFinishCheckIn}
                  className="py-3 bg-[#3B6E38] hover:bg-[#2F592C] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Check-In
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-[#EAF0E9] text-[#3B6E38] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1E2D24]">Check-In Complete!</h3>
                <p className="text-xs text-[#748771] max-w-xs mx-auto mt-1">
                  Your budget balances for the upcoming week have been successfully realigned. Keep building great habits!
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#2D3E33] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D24] transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
