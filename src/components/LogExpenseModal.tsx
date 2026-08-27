import React, { useState } from 'react';
import { Sparkles, Plus, Check, Trash2, X, AlertCircle, RefreshCw, Layers, Edit2, ArrowRight } from 'lucide-react';
import { BudgetCategory, StagingExpense } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { motion, AnimatePresence } from 'motion/react';

interface LogExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  activeTabPreference: 'ai' | 'manual';
  onUpdateTabPreference: (tab: 'ai' | 'manual') => void;
  onConfirmExpenses: (expenses: { amount: number; description: string; categoryId: string }[]) => void;
}

export const LogExpenseModal: React.FC<LogExpenseModalProps> = ({
  isOpen,
  onClose,
  categories,
  activeTabPreference,
  onUpdateTabPreference,
  onConfirmExpenses,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>(activeTabPreference);
  const [stage, setStage] = useState<'input' | 'staging'>('input');
  
  // AI Note state
  const [noteText, setNoteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

  // Manual Entry state
  const [manualAmount, setManualAmount] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCategoryId, setManualCategoryId] = useState(categories[0]?.id || '');
  const [manualBatchCount, setManualBatchCount] = useState(0);

  // Universal Staging items
  const [stagedItems, setStagedItems] = useState<StagingExpense[]>([]);

  // Update tab preference
  const handleTabChange = (tab: 'ai' | 'manual') => {
    setActiveTab(tab);
    onUpdateTabPreference(tab);
  };

  // Sample prompt chips for quick testing
  const samplePrompts = [
    "I paid $50 in gas, $150 at the bar last night, and had to pay my $75 cell phone bill yesterday. I also paid $25 for a case of beer.",
    "Spent $84.20 on groceries at Trader Joe's, $4.75 for oat latte, and invested $100 in index funds.",
    "$45 dinner with Sarah, $12 parking meter, and $65 wifi internet bill."
  ];

  const handleApplySamplePrompt = (prompt: string) => {
    setNoteText(prompt);
  };

  // Process AI Quick Note
  const handleParseAiNote = async () => {
    if (!noteText.trim()) return;
    setIsParsing(true);
    setParseError(null);

    try {
      const res = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: noteText,
          categories: categories.map(c => ({ id: c.id, name: c.name, description: c.description })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse note');
      }

      if (data.items && data.items.length > 0) {
        const newStaged: StagingExpense[] = data.items.map((item: any, idx: number) => {
          // Find matching category ID
          const matched = categories.find(
            c => c.name.toLowerCase() === (item.predictedCategory || '').toLowerCase()
          ) || categories[0];

          return {
            id: `staged-${Date.now()}-${idx}`,
            amount: item.amount,
            description: item.description,
            categoryId: matched.id,
          };
        });

        setStagedItems(prev => [...prev, ...newStaged]);
        setEngineUsed(data.engine || 'AI Engine');
        setStage('staging');
      } else {
        setParseError('No specific expense amounts could be identified. Try phrasing like "$45 for groceries".');
      }
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'An error occurred while parsing. Please check your text.');
    } finally {
      setIsParsing(false);
    }
  };

  // Save & Add Another Manual Entry
  const handleSaveAndAddAnother = () => {
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0 || !manualDesc.trim()) return;

    const newItem: StagingExpense = {
      id: `staged-manual-${Date.now()}-${stagedItems.length}`,
      amount: Math.round(amt * 100) / 100,
      description: manualDesc.trim(),
      categoryId: manualCategoryId || categories[0].id,
    };

    setStagedItems(prev => [...prev, newItem]);
    setManualBatchCount(prev => prev + 1);
    setManualAmount('');
    setManualDesc('');
    // Keep category as last selected
  };

  // Proceed to Staging from Manual
  const handleManualProceedToStaging = () => {
    // If user has filled the current form, stage it too
    const amt = parseFloat(manualAmount);
    if (!isNaN(amt) && amt > 0 && manualDesc.trim()) {
      const newItem: StagingExpense = {
        id: `staged-manual-${Date.now()}-${stagedItems.length}`,
        amount: Math.round(amt * 100) / 100,
        description: manualDesc.trim(),
        categoryId: manualCategoryId || categories[0].id,
      };
      setStagedItems(prev => [...prev, newItem]);
      setManualAmount('');
      setManualDesc('');
    }
    setStage('staging');
  };

  // Staging corrections
  const handleUpdateStagedCategory = (id: string, newCategoryId: string) => {
    setStagedItems(prev => prev.map(item => item.id === id ? { ...item, categoryId: newCategoryId } : item));
  };

  const handleUpdateStagedAmount = (id: string, amountStr: string) => {
    const val = parseFloat(amountStr) || 0;
    setStagedItems(prev => prev.map(item => item.id === id ? { ...item, amount: val } : item));
  };

  const handleUpdateStagedDesc = (id: string, newDesc: string) => {
    setStagedItems(prev => prev.map(item => item.id === id ? { ...item, description: newDesc } : item));
  };

  const handleRemoveStagedItem = (id: string) => {
    setStagedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddNewBlankStagedItem = () => {
    const newItem: StagingExpense = {
      id: `staged-blank-${Date.now()}`,
      amount: 0,
      description: 'New expense',
      categoryId: categories[0]?.id || '',
    };
    setStagedItems(prev => [...prev, newItem]);
  };

  // Final Confirmation
  const handleConfirmAll = () => {
    const validItems = stagedItems.filter(item => item.amount > 0 && item.description.trim());
    if (validItems.length === 0) return;

    onConfirmExpenses(
      validItems.map(item => ({
        amount: item.amount,
        description: item.description,
        categoryId: item.categoryId,
      }))
    );

    // Reset modal state
    setStagedItems([]);
    setNoteText('');
    setManualAmount('');
    setManualDesc('');
    setManualBatchCount(0);
    setStage('input');
    onClose();
  };

  const totalStagedAmount = stagedItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1E2D24]/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-lg bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#E8E1D5] overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#F5EFE6] border-b border-[#E6DDD0] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2D3E33]">
              {stage === 'staging' ? 'Review & Confirm Items' : 'Log New Expense'}
            </h2>
            <p className="text-xs text-[#748771]">
              {stage === 'staging'
                ? `Verify ${stagedItems.length} parsed item${stagedItems.length === 1 ? '' : 's'} before recording`
                : 'Frictionless dual-path manual and AI expense logging'}
            </p>
          </div>
          <button
            id="close-log-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-[#748771] hover:text-[#2D3E33] hover:bg-[#EBE3D5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {stage === 'input' ? (
            <div className="space-y-5">
              {/* Dual-Path Persistent Tabs */}
              <div className="flex bg-[#EBE4D8] p-1 rounded-xl">
                <button
                  id="tab-ai-note"
                  onClick={() => handleTabChange('ai')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'ai'
                      ? 'bg-white text-[#2D3E33] shadow-xs'
                      : 'text-[#6C7B6A] hover:text-[#2D3E33]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#5B7A58]" />
                  Quick Note (AI)
                </button>
                <button
                  id="tab-manual-entry"
                  onClick={() => handleTabChange('manual')}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'manual'
                      ? 'bg-white text-[#2D3E33] shadow-xs'
                      : 'text-[#6C7B6A] hover:text-[#2D3E33]'
                  }`}
                >
                  <Plus className="w-4 h-4 text-[#7C5E45]" />
                  Manual Entry
                  {manualBatchCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-[#2D3E33] text-white rounded-full">
                      {manualBatchCount}
                    </span>
                  )}
                </button>
              </div>

              {/* PATH A: Quick Note (AI Natural Language Processing) */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#2D3E33]">
                      Type or paste your natural spending note:
                    </label>
                    <textarea
                      id="ai-note-input"
                      rows={4}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="e.g. I paid $50 in gas, $150 at the bar last night, and had to pay my $75 cell phone bill yesterday. I also paid $25 for a case of beer."
                      className="w-full p-3.5 bg-white border border-[#DCD3C5] rounded-xl text-sm text-[#2D3E33] focus:outline-none focus:ring-2 focus:ring-[#5B7A58] placeholder-[#9EAE9D] resize-none"
                    />
                  </div>

                  {/* Sample Chips */}
                  <div>
                    <span className="text-[11px] font-medium text-[#748771] block mb-1.5">
                      Tap a quick example to test multi-item compound parsing:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {samplePrompts.map((prompt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleApplySamplePrompt(prompt)}
                          className="text-left text-xs bg-[#F2EDE4] hover:bg-[#EBE3D5] text-[#3E5244] p-2 rounded-lg border border-[#E0D7C9] transition-colors leading-relaxed"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {parseError && (
                    <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-xs text-[#D9383A] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{parseError}</span>
                    </div>
                  )}

                  <button
                    id="parse-ai-note-btn"
                    type="button"
                    disabled={isParsing || !noteText.trim()}
                    onClick={handleParseAiNote}
                    className="w-full py-3.5 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isParsing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#A5C9A1]" />
                        Parsing Compound Line Items...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#A5C9A1]" />
                        Extract Line Items & Review
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* PATH B: Manual Entry */}
              {activeTab === 'manual' && (
                <div className="space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                      Amount ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#748771]">
                        $
                      </span>
                      <input
                        id="manual-amount-input"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 bg-white border border-[#DCD3C5] rounded-xl text-base font-semibold text-[#2D3E33] focus:outline-none focus:ring-2 focus:ring-[#5B7A58]"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                      Description / Merchant
                    </label>
                    <input
                      id="manual-desc-input"
                      type="text"
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      placeholder="e.g. Shell Gas refill, Coffee beans"
                      className="w-full px-3.5 py-3 bg-white border border-[#DCD3C5] rounded-xl text-sm text-[#2D3E33] focus:outline-none focus:ring-2 focus:ring-[#5B7A58]"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                      Budget Category
                    </label>
                    <select
                      id="manual-category-select"
                      value={manualCategoryId}
                      onChange={(e) => setManualCategoryId(e.target.value)}
                      className="w-full px-3.5 py-3 bg-white border border-[#DCD3C5] rounded-xl text-sm text-[#2D3E33] focus:outline-none focus:ring-2 focus:ring-[#5B7A58]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — ({c.description})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Counter Status */}
                  {stagedItems.length > 0 && (
                    <div className="p-3 bg-[#EAF0E9] border border-[#C6D7C4] rounded-xl flex items-center justify-between text-xs text-[#2D3E33]">
                      <span className="font-medium">
                        📦 {stagedItems.length} receipt{stagedItems.length === 1 ? '' : 's'} batched ({formatCurrency(totalStagedAmount)})
                      </span>
                      <button
                        type="button"
                        onClick={() => setStage('staging')}
                        className="text-xs font-bold text-[#3B6E38] hover:underline"
                      >
                        View Batch
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      id="save-and-add-another-btn"
                      type="button"
                      onClick={handleSaveAndAddAnother}
                      disabled={!manualAmount || !manualDesc.trim()}
                      className="py-3 px-3 bg-[#EAE3D5] hover:bg-[#DDD3C2] text-[#2D3E33] rounded-xl text-xs font-semibold border border-[#D4C8B6] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Save & Add Another
                    </button>

                    <button
                      id="manual-proceed-staging-btn"
                      type="button"
                      onClick={handleManualProceedToStaging}
                      disabled={stagedItems.length === 0 && (!manualAmount || !manualDesc.trim())}
                      className="py-3 px-3 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      Review & Confirm
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* UNIVERSAL STAGING & CONFIRMATION FLOW */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#748771]">
                  Extracted Items ({stagedItems.length})
                </span>
                <span className="text-xs font-bold text-[#2D3E33]">
                  Total: {formatCurrency(totalStagedAmount)}
                </span>
              </div>

              {engineUsed && (
                <div className="text-[11px] text-[#5B7A58] bg-[#EAF0E9] px-2.5 py-1 rounded-md inline-block font-medium">
                  Parsed via: {engineUsed}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                {stagedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-[#E6DDD0] rounded-xl shadow-2xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#8A9A87] w-5">
                        #{idx + 1}
                      </span>
                      {/* Description input */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateStagedDesc(item.id, e.target.value)}
                        placeholder="Description"
                        className="flex-1 px-2.5 py-1.5 text-xs bg-[#FBF9F5] border border-[#E6DDD0] rounded-lg text-[#2D3E33] font-medium focus:ring-1 focus:ring-[#5B7A58] outline-none"
                      />
                      {/* Amount input */}
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#748771]">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount || ''}
                          onChange={(e) => handleUpdateStagedAmount(item.id, e.target.value)}
                          className="w-full pl-5 pr-2 py-1.5 text-xs bg-[#FBF9F5] border border-[#E6DDD0] rounded-lg text-[#2D3E33] font-bold focus:ring-1 focus:ring-[#5B7A58] outline-none text-right"
                        />
                      </div>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveStagedItem(item.id)}
                        className="p-1.5 text-[#A68F80] hover:text-[#D9383A] hover:bg-[#FDF2F2] rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Category Dropdown for Interactive Correction */}
                    <div className="flex items-center gap-2 pl-7">
                      <span className="text-[10px] uppercase font-semibold text-[#8A9A87]">
                        Category:
                      </span>
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleUpdateStagedCategory(item.id, e.target.value)}
                        className="flex-1 text-xs py-1 px-2 bg-[#F6F2EA] border border-[#E6DDD0] rounded-md text-[#2D3E33] font-medium focus:ring-1 focus:ring-[#5B7A58] outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {stagedItems.length === 0 && (
                  <div className="text-center py-6 text-xs text-[#748771]">
                    No items staged. Add an expense to get started.
                  </div>
                )}
              </div>

              {/* Add blank row button */}
              <button
                type="button"
                onClick={handleAddNewBlankStagedItem}
                className="w-full py-2 bg-[#F5EFE6] hover:bg-[#EBE3D5] text-[#2D3E33] rounded-lg text-xs font-semibold border border-dashed border-[#D4C8B6] flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Item
              </button>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E6DDD0]">
                <button
                  type="button"
                  onClick={() => setStage('input')}
                  className="py-3 px-3 bg-[#EAE3D5] hover:bg-[#DDD3C2] text-[#2D3E33] rounded-xl text-xs font-semibold transition-colors"
                >
                  Back to Edit
                </button>

                <button
                  id="confirm-all-expenses-btn"
                  type="button"
                  disabled={stagedItems.length === 0 || totalStagedAmount <= 0}
                  onClick={handleConfirmAll}
                  className="py-3 px-3 bg-[#3B6E38] hover:bg-[#2F592C] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Confirm All ({stagedItems.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
