import React, { useState } from 'react';
import { Settings, User, Users, Calendar, DollarSign, RotateCcw, Clock, AlertTriangle, X, Check, Shield } from 'lucide-react';
import { AccountType, BudgetCategory, CalendarMode, PaySchedule, UserConfig } from '../types';
import { formatCurrency, normalizeToWeeklyIncome } from '../utils/budgetUtils';
import { motion } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userConfig: UserConfig;
  categories: BudgetCategory[];
  onSaveConfig: (updatedConfig: UserConfig, updatedCategories: BudgetCategory[]) => void;
  onResetAllData: () => void;
  onOpenOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userConfig,
  categories,
  onSaveConfig,
  onResetAllData,
  onOpenOnboarding,
}) => {
  const [name, setName] = useState(userConfig.name);
  const [accountType, setAccountType] = useState<AccountType>(userConfig.accountType);
  const [roommatesCount, setRoommatesCount] = useState(userConfig.roommatesCount || 2);
  const [rawIncome, setRawIncome] = useState(userConfig.rawIncome);
  const [paySchedule, setPaySchedule] = useState<PaySchedule>(userConfig.paySchedule);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(userConfig.calendarMode);
  const [dayOffset, setDayOffset] = useState<number>(userConfig.simulationDayOffset || 0);

  // Category baseline editing
  const [catBaselines, setCatBaselines] = useState<{ [id: string]: number }>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.baselineWeeklyBudget }), {})
  );

  const calculatedWeeklyPool = normalizeToWeeklyIncome(rawIncome, paySchedule);
  const totalAllocated = (Object.values(catBaselines) as number[]).reduce((a: number, b: number) => a + b, 0);

  const handleSave = () => {
    const updatedConfig: UserConfig = {
      ...userConfig,
      name: name.trim() || 'Alex Rivera',
      accountType,
      roommatesCount: accountType === 'roommate' ? roommatesCount : undefined,
      rawIncome,
      paySchedule,
      weeklyIncomePool: calculatedWeeklyPool,
      calendarMode,
      simulationDayOffset: dayOffset,
    };

    const updatedCategories = categories.map(cat => ({
      ...cat,
      baselineWeeklyBudget: catBaselines[cat.id] || cat.baselineWeeklyBudget,
      currentWeeklyBudget: catBaselines[cat.id] || cat.currentWeeklyBudget,
    }));

    onSaveConfig(updatedConfig, updatedCategories);
    onClose();
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
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#2D3E33]" />
            <h2 className="text-base font-bold text-[#1E2D24]">Account & Calendar Settings</h2>
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
          {/* Household / Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#748771] uppercase tracking-wider">
              Profile & Household
            </h3>
            <div>
              <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                Name / Budget Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DCD3C5] rounded-xl text-xs text-[#2D3E33] focus:ring-2 focus:ring-[#5B7A58] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 bg-white border border-[#DCD3C5] rounded-xl text-xs text-[#2D3E33]"
                >
                  <option value="single">Single-person</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family</option>
                  <option value="roommate">Roommate</option>
                </select>
              </div>

              {accountType === 'roommate' && (
                <div>
                  <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                    Roommate Count
                  </label>
                  <input
                    type="number"
                    value={roommatesCount}
                    onChange={(e) => setRoommatesCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-[#DCD3C5] rounded-xl text-xs text-[#2D3E33]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Income & Normalization */}
          <div className="space-y-3 pt-2 border-t border-[#E8E1D5]">
            <h3 className="text-xs font-bold text-[#748771] uppercase tracking-wider">
              Income & Budget Pool
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                  Income Amount ($)
                </label>
                <input
                  type="number"
                  value={rawIncome}
                  onChange={(e) => setRawIncome(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-[#DCD3C5] rounded-xl text-xs font-bold text-[#2D3E33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2D3E33] mb-1">
                  Pay Schedule
                </label>
                <select
                  value={paySchedule}
                  onChange={(e) => setPaySchedule(e.target.value as PaySchedule)}
                  className="w-full px-3 py-2 bg-white border border-[#DCD3C5] rounded-xl text-xs text-[#2D3E33]"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 bg-[#EAF0E9] rounded-xl text-xs text-[#3E5244] flex justify-between items-center font-medium">
              <span>Calculated Weekly Pool:</span>
              <strong className="text-sm">{formatCurrency(calculatedWeeklyPool)}</strong>
            </div>
          </div>

          {/* Calendar Architecture Override */}
          <div className="space-y-2 pt-2 border-t border-[#E8E1D5]">
            <h3 className="text-xs font-bold text-[#748771] uppercase tracking-wider">
              Calendar Architecture Settings
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCalendarMode('weekly')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                  calendarMode === 'weekly'
                    ? 'bg-[#EAF0E9] border-[#5B7A58] text-[#2D3E33]'
                    : 'bg-white border-[#EBE6DC] text-[#748771]'
                }`}
              >
                Fiscal Weekly (Default)
                <span className="block text-[10px] font-normal text-[#5C7257]">
                  Weekly check-in cycles
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarMode('monthly')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                  calendarMode === 'monthly'
                    ? 'bg-[#EAF0E9] border-[#5B7A58] text-[#2D3E33]'
                    : 'bg-white border-[#EBE6DC] text-[#748771]'
                }`}
              >
                Calendar Month
                <span className="block text-[10px] font-normal text-[#5C7257]">
                  Monthly overview cycles
                </span>
              </button>
            </div>
          </div>

          {/* Time Travel Simulator (for testing active/past-due check-in) */}
          <div className="space-y-2 pt-2 border-t border-[#E8E1D5] bg-[#F6F2EA] p-3.5 rounded-2xl border">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D3E33]">
              <Clock className="w-4 h-4 text-[#7C5E45]" />
              Simulation Day Offset (Check-In Behavior Tester)
            </div>
            <p className="text-[11px] text-[#748771]">
              Simulate days to see the check-in button activate on Friday/Sunday or turn RED on Monday when past due:
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setDayOffset(0)}
                className={`py-1.5 text-[11px] font-bold rounded-lg border ${
                  dayOffset === 0 ? 'bg-[#2D3E33] text-white' : 'bg-white text-[#2D3E33]'
                }`}
              >
                Today (Real)
              </button>
              <button
                type="button"
                onClick={() => setDayOffset(2)}
                className={`py-1.5 text-[11px] font-bold rounded-lg border ${
                  dayOffset === 2 ? 'bg-[#2D3E33] text-white' : 'bg-white text-[#2D3E33]'
                }`}
              >
                +2 Days (Active)
              </button>
              <button
                type="button"
                onClick={() => setDayOffset(5)}
                className={`py-1.5 text-[11px] font-bold rounded-lg border ${
                  dayOffset === 5 ? 'bg-[#D9383A] text-white' : 'bg-white text-[#D9383A] border-[#D9383A]/30'
                }`}
              >
                +5 Days (Past Due)
              </button>
            </div>
          </div>

          {/* Reset / Onboarding restart */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8E1D5]">
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="text-xs font-semibold text-[#5B7A58] hover:underline"
            >
              Re-run Setup Wizard
            </button>

            <button
              type="button"
              onClick={onResetAllData}
              className="text-xs font-semibold text-[#748771] hover:text-[#D9383A] transition-colors"
            >
              Reset Data to Defaults
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              id="save-settings-btn"
              onClick={handleSave}
              className="w-full py-3.5 bg-[#2D3E33] hover:bg-[#1E2D24] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Check className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
