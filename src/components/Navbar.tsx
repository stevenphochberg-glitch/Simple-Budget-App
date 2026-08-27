import React from 'react';
import { Sparkles, Calendar, Settings, ShieldCheck, AlertTriangle, User } from 'lucide-react';
import { CalendarMode, UserConfig } from '../types';
import { getWeekRangeDisplay } from '../utils/budgetUtils';

interface NavbarProps {
  userConfig: UserConfig;
  timeframe: 'week' | 'month';
  onTimeframeToggle: (mode: 'week' | 'month') => void;
  onOpenSettings: () => void;
  onOpenCheckIn: () => void;
  onOpenMonthlyReview: () => void;
  isCheckInActive: boolean;
  isPastDue: boolean;
  simulatedDate: Date;
}

export const Navbar: React.FC<NavbarProps> = ({
  userConfig,
  timeframe,
  onTimeframeToggle,
  onOpenSettings,
  onOpenCheckIn,
  onOpenMonthlyReview,
  isCheckInActive,
  isPastDue,
  simulatedDate,
}) => {
  const weekRange = getWeekRangeDisplay(simulatedDate);
  const monthName = simulatedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E8E1D5] px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Date range */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2D3E33] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            SB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#1E2D24] leading-tight">
                Simple Budgeting
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#EAF0E9] text-[#5C7257] rounded-md hidden sm:inline">
                {userConfig.calendarMode === 'weekly' ? 'Fiscal Weekly' : 'Calendar Month'}
              </span>
            </div>
            <p className="text-[11px] text-[#748771] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#8A9A87]" />
              {timeframe === 'week' ? weekRange.full : monthName}
            </p>
          </div>
        </div>

        {/* Right: Timeframe Toggle & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Timeframe Toggle: Switch summary between Week and Month views */}
          <div className="bg-[#EBE4D8] p-0.5 rounded-xl flex items-center">
            <button
              id="timeframe-week-toggle"
              onClick={() => onTimeframeToggle('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeframe === 'week'
                  ? 'bg-white text-[#2D3E33] shadow-2xs'
                  : 'text-[#6C7B6A] hover:text-[#2D3E33]'
              }`}
            >
              Week
            </button>
            <button
              id="timeframe-month-toggle"
              onClick={() => onTimeframeToggle('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeframe === 'month'
                  ? 'bg-white text-[#2D3E33] shadow-2xs'
                  : 'text-[#6C7B6A] hover:text-[#2D3E33]'
              }`}
            >
              Month
            </button>
          </div>

          {/* Quick Check-in CTA Button in Header (Desktop) */}
          <button
            id="nav-check-in-btn"
            onClick={onOpenCheckIn}
            className={`hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isPastDue
                ? 'bg-[#D9383A] text-white hover:bg-[#C22E30] animate-pulse'
                : isCheckInActive
                ? 'bg-[#3B6E38] text-white hover:bg-[#2F592C]'
                : 'bg-white text-[#2D3E33] border border-[#E0D7C9] hover:bg-[#F5EFE6]'
            }`}
          >
            {isPastDue ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                Check In (Past Due)
              </>
            ) : isCheckInActive ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#A5C9A1]" />
                Check In Active
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#748771]" />
                Weekly Check-In
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white border border-[#E0D7C9] text-[#748771] hover:text-[#2D3E33] hover:bg-[#F5EFE6] transition-colors"
            title="Account & Budget Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
