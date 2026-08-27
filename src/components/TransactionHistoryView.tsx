import React, { useState } from 'react';
import { ArrowLeft, Search, Trash2, Edit3, Filter, Calendar, Tag, Plus, Check } from 'lucide-react';
import { BudgetCategory, ExpenseItem } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionHistoryViewProps {
  selectedCategoryId: string; // 'all' or specific category ID
  categories: BudgetCategory[];
  expenses: ExpenseItem[];
  timeframe: 'week' | 'month';
  onSelectCategoryTab: (categoryId: string) => void;
  onBackToDashboard: () => void;
  onDeleteExpense: (expenseId: string) => void;
  onEditExpense: (updated: ExpenseItem) => void;
  onOpenLogModal: () => void;
}

export const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({
  selectedCategoryId,
  categories,
  expenses,
  timeframe,
  onSelectCategoryTab,
  onBackToDashboard,
  onDeleteExpense,
  onEditExpense,
  onOpenLogModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);

  // Filter expenses by selected category
  const filteredByCategory = selectedCategoryId === 'all'
    ? expenses
    : expenses.filter(e => e.categoryId === selectedCategoryId);

  // Filter by search query
  const displayedExpenses = filteredByCategory.filter(e => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const cat = categories.find(c => c.id === e.categoryId);
    return (
      e.description.toLowerCase().includes(query) ||
      (cat && cat.name.toLowerCase().includes(query)) ||
      e.amount.toString().includes(query)
    );
  }).sort((a, b) => b.timestamp - a.timestamp);

  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const totalAmount = displayedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Save edit
  const handleSaveEdit = () => {
    if (!editingItem || editingItem.amount <= 0 || !editingItem.description.trim()) return;
    onEditExpense(editingItem);
    setEditingItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header with Back Button */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E1D5]">
        <button
          id="back-to-dashboard-btn"
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E0D7C9] text-xs font-semibold text-[#2D3E33] hover:bg-[#F5EFE6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        <h1 className="text-base font-bold text-[#1E2D24]">
          {selectedCategoryId === 'all' ? 'All Transactions' : `${activeCategory?.name || 'Category'} History`}
        </h1>

        <button
          onClick={onOpenLogModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2D3E33] text-white text-xs font-semibold hover:bg-[#1E2D24] transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Log
        </button>
      </div>

      {/* LATERAL NAVIGATION BAR (Horizontal Scrolling Tab Bar) */}
      <div className="overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 min-w-max">
          {/* Master View Tab */}
          <button
            id="tab-all-transactions"
            onClick={() => onSelectCategoryTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategoryId === 'all'
                ? 'bg-[#2D3E33] text-white shadow-xs'
                : 'bg-white text-[#6C7B6A] hover:bg-[#EBE4D8] border border-[#E8E1D5]'
            }`}
          >
            All Transactions
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategoryId === 'all' ? 'bg-white/20 text-white' : 'bg-[#EAE3D5] text-[#2D3E33]'}`}>
              {expenses.length}
            </span>
          </button>

          {/* Category Tabs */}
          {categories.map(cat => {
            const count = expenses.filter(e => e.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                id={`tab-category-${cat.id}`}
                onClick={() => onSelectCategoryTab(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2D3E33] text-white shadow-xs'
                    : 'bg-white text-[#6C7B6A] hover:bg-[#EBE4D8] border border-[#E8E1D5]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#A5C9A1' : cat.color }}
                />
                {cat.name}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-[#EAE3D5] text-[#2D3E33]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stat Banner */}
      <div className="p-4 bg-white rounded-2xl border border-[#EBE6DC] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#8A9A87] block">
            {selectedCategoryId === 'all' ? 'Total Logged' : `${activeCategory?.name} Total`}
          </span>
          <span className="text-xl font-bold text-[#2D3E33]">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#748771]">
          <div>
            <span className="block text-[10px] uppercase text-[#8A9A87]">Entries</span>
            <span className="font-semibold text-[#2D3E33]">{displayedExpenses.length}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#8A9A87]">Average</span>
            <span className="font-semibold text-[#2D3E33]">
              {displayedExpenses.length > 0
                ? formatCurrency(totalAmount / displayedExpenses.length)
                : '$0'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8A9A87] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by description, merchant, or amount..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E0D7C9] rounded-xl text-xs sm:text-sm text-[#2D3E33] focus:outline-none focus:ring-2 focus:ring-[#5B7A58]"
        />
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {displayedExpenses.map(expense => {
            const cat = categories.find(c => c.id === expense.categoryId);
            const isEditingThis = editingItem?.id === expense.id;

            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 bg-white border border-[#EBE6DC] rounded-xl shadow-2xs transition-all hover:border-[#D8CEBE]"
              >
                {isEditingThis ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editingItem.description}
                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                        className="px-3 py-1.5 text-xs bg-[#FBF9F5] border border-[#DCD3C5] rounded-lg text-[#2D3E33] font-medium"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editingItem.amount}
                        onChange={(e) => setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 })}
                        className="px-3 py-1.5 text-xs bg-[#FBF9F5] border border-[#DCD3C5] rounded-lg text-[#2D3E33] font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={editingItem.categoryId}
                        onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                        className="flex-1 text-xs py-1.5 px-2 bg-[#FBF9F5] border border-[#DCD3C5] rounded-lg text-[#2D3E33]"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 bg-[#3B6E38] text-white rounded-lg hover:bg-[#2F592C] text-xs font-semibold flex items-center gap-1 px-3"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-2 py-1.5 text-xs text-[#748771] hover:text-[#2D3E33]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2.5 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: cat?.color || '#5B7A58' }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#1E2D24] truncate">
                          {expense.description}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#748771]">
                          <span>{expense.date}</span>
                          <span>•</span>
                          <span
                            className="font-medium px-1.5 py-0.2 rounded text-[10px]"
                            style={{ backgroundColor: cat?.bgColor || '#EAF0E9', color: cat?.color || '#2D3E33' }}
                          >
                            {cat?.name || 'Category'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm sm:text-base font-bold text-[#2D3E33]">
                        {formatCurrency(expense.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingItem(expense)}
                          className="p-1.5 text-[#8A9A87] hover:text-[#2D3E33] hover:bg-[#F5EFE6] rounded-lg transition-colors"
                          title="Edit transaction"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(expense.id)}
                          className="p-1.5 text-[#8A9A87] hover:text-[#D9383A] hover:bg-[#FDF2F2] rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {displayedExpenses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#DCD3C5] p-6 space-y-3">
            <p className="text-sm font-semibold text-[#2D3E33]">No transactions found</p>
            <p className="text-xs text-[#748771] max-w-sm mx-auto">
              {searchQuery ? 'Try clearing your search query' : 'Log your first expense in this category to track spending.'}
            </p>
            <button
              onClick={onOpenLogModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D3E33] text-white rounded-xl text-xs font-bold hover:bg-[#1E2D24] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Log Expense Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
