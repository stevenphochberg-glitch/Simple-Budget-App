import React from 'react';
import { LayoutGrid, Plus, Receipt, ShieldCheck, AlertTriangle, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'transactions' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'settings') => void;
  onOpenLogExpense: () => void;
  onOpenCheckIn: () => void;
  isCheckInActive: boolean;
  isPastDue: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogExpense,
  onOpenCheckIn,
  isCheckInActive,
  isPastDue,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E8E1D5] md:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-2 relative">
        {/* Dashboard */}
        <button
          id="bottom-nav-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
            currentTab === 'dashboard'
              ? 'text-[#2D3E33] font-bold'
              : 'text-[#8A9A87] hover:text-[#2D3E33]'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">Budget</span>
        </button>

        {/* Transactions History */}
        <button
          id="bottom-nav-transactions"
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
            currentTab === 'transactions'
              ? 'text-[#2D3E33] font-bold'
              : 'text-[#8A9A87] hover:text-[#2D3E33]'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">History</span>
        </button>

        {/* Primary Action: Single, prominent "Log Expense" CTA */}
        <div className="relative -top-3">
          <motion.button
            id="primary-mobile-log-cta"
            whileTap={{ scale: 0.94 }}
            onClick={onOpenLogExpense}
            className="w-13 h-13 rounded-full bg-[#2D3E33] text-white flex items-center justify-center shadow-lg shadow-[#2D3E33]/25 border-4 border-[#FDFBF7] hover:bg-[#1E2D24] transition-transform"
            title="Log Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* Weekly Check-In */}
        <button
          id="bottom-nav-checkin"
          onClick={onOpenCheckIn}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl relative transition-colors ${
            isPastDue
              ? 'text-[#D9383A] font-extrabold animate-pulse'
              : isCheckInActive
              ? 'text-[#3B6E38] font-bold'
              : 'text-[#8A9A87] hover:text-[#2D3E33]'
          }`}
        >
          {isPastDue ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              <span className="text-[10px]">Check In</span>
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#D9383A]" />
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px]">Check In</span>
              {isCheckInActive && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#3B6E38]" />
              )}
            </>
          )}
        </button>

        {/* Settings */}
        <button
          id="bottom-nav-settings"
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
            currentTab === 'settings'
              ? 'text-[#2D3E33] font-bold'
              : 'text-[#8A9A87] hover:text-[#2D3E33]'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>
    </div>
  );
};
