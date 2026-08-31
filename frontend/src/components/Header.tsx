import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Bell, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface HeaderProps {
  pageTitle: string;
  onOpenSearch: () => void;
  onOpenAddCustomer: () => void;
  onOpenRecordPayment: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  onOpenAddCustomer,
  onOpenRecordPayment
}) => {
  const { unreadCount, toggleDrawer } = useNotifications();

  // Live Date and Time State
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format live time string (e.g. 10:30:45 PM)
  const timeString = currentDateTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Format live date string (e.g. Mon, 31 Aug 2026)
  const dateString = currentDateTime.toLocaleDateString([], {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="h-16 sticky top-0 z-30 bg-[#0b0f19]/80 backdrop-blur-2xl border-b border-slate-800/80 px-6 flex items-center justify-between transition-colors">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-white capitalize">
          {pageTitle}
        </h1>
      </div>

      {/* Center Blank Space: Live Real-Time Date & Clock in White Text */}
      <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 bg-slate-900/90 border border-slate-700/60 rounded-xl shadow-inner">
        <div className="flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm tracking-wide">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <span>{dateString}</span>
        </div>
        <span className="text-slate-600 font-bold">•</span>
        <div className="flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm font-mono tracking-wider">
          <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{timeString}</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3">
        {/* Quick Record Payment CTA */}
        <button
          onClick={onOpenRecordPayment}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <DollarSign className="w-4 h-4" />
          <span>Record Payment</span>
        </button>

        {/* Quick Add Customer CTA */}
        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>

        {/* Notification Bell Drawer */}
        <button
          onClick={toggleDrawer}
          className="relative p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
