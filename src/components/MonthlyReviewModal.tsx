import React, { useState } from 'react';
import { Calendar, RotateCcw, Award, CheckCircle2, TrendingUp, Sparkles, X, Target } from 'lucide-react';
import { BudgetCategory, ExpenseItem, MonthlyRetrospective } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

interface MonthlyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  expenses: ExpenseItem[];
  monthlyIncome: number;
  simulatedDate: Date;
  onExecuteHardReset: (retrospective: MonthlyRetrospective, resetCategories: BudgetCategory[]) => void;
}

export const MonthlyReviewModal: React.FC<MonthlyReviewModalProps> = ({
  isOpen,
  onClose,
  categories,
  expenses,
  monthlyIncome,
  simulatedDate,
  onExecuteHardReset,
}) => {
  const [intentionText, setIntentionText] = useState('Focus on mindful dining out and consistent savings allocations.');
  const [isDone, setIsDone] = useState(false);

  const monthLabel = simulatedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalSpentMonth = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSavedEstimated = Math.max(0, monthlyIncome - totalSpentMonth);
  const savingsRate = monthlyIncome > 0 ? Math.round((totalSavedEstimated / monthlyIncome) * 100) : 0;

  const handleApplyHardReset = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#5B7A58', '#6B9AC4', '#7C5E45', '#2D3E33']
      });
    } catch {
      // safe fallback
    }

    // Reset all current budgets back to their persistent baseline
    const resetCategories = categories.map(cat => ({
      ...cat,
      currentWeeklyBudget: cat.baselineWeeklyBudget,
    }));

    const retro: MonthlyRetrospective = {
      monthId: `${simulatedDate.getFullYear()}-${(simulatedDate.getMonth() + 1).toString().padStart(2, '0')}`,
      monthLabel,
      completedAt: new Date().toISOString(),
      totalIncome: monthlyIncome,
      totalSpent: totalSpentMonth,
      totalSaved: totalSavedEstimated,
      intentions: intentionText,
    };

    onExecuteHardReset(retro, resetCategories);
    setIsDone(true);
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
        <div className="px-6 py-4 bg-[#F5EFE6] border-b border-[#E6DDD0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2D3E33] text-white flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E2D24]">Monthly Retrospective & Hard Reset</h2>
              <p className="text-xs text-[#748771]">{monthLabel} Wrap-Up</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#748771] hover:text-[#2D3E33] hover:bg-[#EAE3D5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!isDone ? (
            <>
              {/* Monthly Stats Bento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-white border border-[#E8E1D5] rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-[#8A9A87] block mb-1">
                    Monthly Income Pool
                  </span>
                  <span className="text-lg font-bold text-[#2D3E33]">
                    {formatCurrency(monthlyIncome)}
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-[#E8E1D5] rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-[#8A9A87] block mb-1">
                    Total Spent
                  </span>
                  <span className="text-lg font-bold text-[#2D3E33]">
                    {formatCurrency(totalSpentMonth)}
                  </span>
                </div>
                <div className="p-3.5 bg-[#EAF0E9] border border-[#C6D7C4] rounded-2xl col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5C7257] block">
                      Estimated Net Savings
                    </span>
                    <span className="text-xl font-extrabold text-[#2D3E33]">
                      {formatCurrency(totalSavedEstimated)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 bg-[#3B6E38] text-white rounded-full">
                      {savingsRate}% Saved
                    </span>
                  </div>
                </div>
              </div>

              {/* End of Month Hard Reset Explainer */}
              <div className="p-4 bg-[#F5EFE6] border border-[#E0D7C9] rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[#2D3E33]">
                  <RotateCcw className="w-4 h-4 text-[#7C5E45]" />
                  <h3 className="text-xs font-bold">End-of-Month Hard Reset Philosophy</h3>
                </div>
                <p className="text-xs text-[#5C4430] leading-relaxed">
                  Rollovers and prorated adjustments strictly occur <em>within</em> a single calendar month.
                  Executing this reset restores all categories back to your baseline budget set, giving you a fresh start without dragging past deficits or surpluses into the new month.
                </p>
              </div>

              {/* Set Intentions */}
              <div>
                <label className="block text-xs font-semibold text-[#2D3E33] mb-1.5 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#5B7A58]" />
                  Set Intentions for Upcoming Month:
                </label>
                <textarea
                  rows={2}
                  value={intentionText}
                  onChange={(e) => setIntentionText(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-[#DCD3C5] rounded-xl text-[#2D3E33] focus:ring-2 focus:ring-[#5B7A58] outline-none"
                  placeholder="What is your financial focus for the upcoming month?"
                />
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  id="execute-hard-reset-btn"
                  onClick={handleApplyHardReset}
                  className="w-full py-3.5 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-[#A5C9A1]" />
                  Execute Hard Reset & Start New Month
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-[#EAF0E9] text-[#3B6E38] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1E2D24]">New Month Begun!</h3>
                <p className="text-xs text-[#748771] max-w-xs mx-auto mt-1">
                  All category budgets have been reset to baseline defaults. Your intention has been recorded.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#2D3E33] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D24] transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
