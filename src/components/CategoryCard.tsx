import React from 'react';
import { ShoppingBag, Coffee, Receipt, PiggyBank, PlusCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { BudgetCategory, CategorySummary } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { motion } from 'motion/react';

interface CategoryCardProps {
  summary: CategorySummary;
  timeframe: 'week' | 'month';
  multiplier: number;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  summary,
  timeframe,
  multiplier,
  onSelectCategory,
}) => {
  const { category, budgetSet, totalLogged, remaining, transactionCount, percentSpent, isOverspent } = summary;

  // Icon mapping
  const renderIcon = (name: string) => {
    switch (name) {
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5" />;
      case 'Receipt':
        return <Receipt className="w-5 h-5" />;
      case 'PiggyBank':
        return <PiggyBank className="w-5 h-5" />;
      default:
        return <PlusCircle className="w-5 h-5" />;
    }
  };

  // Guardrail: RED is strictly reserved for actionable overspending alerts
  const getProgressColor = () => {
    if (isOverspent) return 'bg-[#D9383A]'; // STRICT RED
    if (percentSpent > 85) return 'bg-[#C78736]'; // Warm amber warning
    if (category.key === 'fun_money') return 'bg-[#6B9AC4]'; // Soft Sky Blue
    if (category.key === 'bills') return 'bg-[#8A6A4F]'; // Earthy Brown
    if (category.key === 'savings') return 'bg-[#2D3E33]'; // Dark Forest Green
    return 'bg-[#607D5A]'; // Sage Green
  };

  return (
    <motion.div
      id={`category-card-${category.id}`}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelectCategory(category.id)}
      className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isOverspent
          ? 'bg-[#FFF8F8] border-[#D9383A]/30 shadow-sm'
          : 'bg-white border-[#EBE6DC] hover:border-[#D8CEBE] shadow-xs'
      }`}
    >
      {/* Top row: Icon, Category Name, Tally & Arrow */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isOverspent ? '#FEE2E2' : category.bgColor,
              color: isOverspent ? '#D9383A' : category.color,
            }}
          >
            {renderIcon(category.iconName)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1E2D24] flex items-center gap-1.5">
              {category.name}
              {isOverspent && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D9383A] text-white">
                  OVER
                </span>
              )}
            </h3>
            <p className="text-xs text-[#748771]">
              {transactionCount} {transactionCount === 1 ? 'logged expense' : 'logged expenses'}
            </p>
          </div>
        </div>

        <div className="flex items-center text-[#849681] hover:text-[#2D3E33] transition-colors">
          <span className="text-xs font-medium mr-1 hidden sm:inline">Details</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 py-2 mb-3 bg-[#FBF9F5] rounded-xl px-3 border border-[#F2ECE1]">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A9A87] block">
            Budget Set
          </span>
          <span className="text-xs sm:text-sm font-semibold text-[#2D3E33]">
            {formatCurrency(budgetSet)}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A9A87] block">
            Logged
          </span>
          <span className={`text-xs sm:text-sm font-semibold ${isOverspent ? 'text-[#D9383A]' : 'text-[#2D3E33]'}`}>
            {formatCurrency(totalLogged)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A9A87] block">
            {isOverspent ? 'Over by' : 'Remaining'}
          </span>
          <span
            className={`text-xs sm:text-sm font-bold ${
              isOverspent
                ? 'text-[#D9383A]'
                : remaining > 0
                ? 'text-[#3B6E38]'
                : 'text-[#5C7257]'
            }`}
          >
            {isOverspent ? formatCurrency(Math.abs(remaining)) : formatCurrency(remaining)}
          </span>
        </div>
      </div>

      {/* Visual Reinforcement: Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-medium text-[#748771]">
          <span>{Math.round(percentSpent)}% allocated</span>
          {isOverspent && (
            <span className="text-[#D9383A] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Exceeds budget
            </span>
          )}
        </div>
        <div className="w-full h-2.5 bg-[#EBE6DC] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
            style={{ width: `${Math.min(100, Math.max(0, percentSpent))}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};
