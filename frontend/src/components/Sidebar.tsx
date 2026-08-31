import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { DateDetailsModal } from './DateDetailsModal';

export type NavTab =
  | 'dashboard'
  | 'customers'
  | 'loans'
  | 'payments'
  | 'reports'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed
}) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  // Mini Calendar State
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'payments', label: 'Payments', icon: Receipt },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Calendar Calculation Helpers
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const monthName = calendarMonth.toLocaleString('default', { month: 'short' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCalendarMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dayNum: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    setSelectedDate(dateStr);
    setIsDateModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Set of dates that have payments collected
  const paymentDatesSet = new Set(payments.map((p) => p.date));

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen z-40 bg-[#0b0f19] border-r border-slate-800 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo.jpg"
              alt="Matrix Finance Logo"
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/25 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-white leading-none">
                  Matrix Finance
                </span>
                <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase mt-1">
                  Finance & Loan Ledgers
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="py-3 px-3 space-y-1 overflow-y-auto shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavTab)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-800">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1.5 text-indigo-400">({item.badge})</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Blank Space Calendar Widget */}
        <div className="flex-1 px-3 py-2 flex flex-col justify-center min-h-0 overflow-y-auto">
          {!isCollapsed ? (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                  {monthName} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Name Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-500">
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Blank offset cells */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`blank-${i}`} className="h-6" />
                ))}

                {/* Days of Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const mm = String(month + 1).padStart(2, '0');
                  const dd = String(dayNum).padStart(2, '0');
                  const dateStr = `${year}-${mm}-${dd}`;

                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasCollection = paymentDatesSet.has(dateStr);

                  return (
                    <button
                      key={dayNum}
                      onClick={() => handleDateClick(dayNum)}
                      className={`h-6 w-full rounded-lg text-[11px] font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : isToday
                          ? 'bg-slate-800 text-indigo-400 border border-indigo-500/50'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasCollection && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-indigo-400 font-semibold text-center mt-2">
                Click any date for Financial Ledger
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  setSelectedDate(todayStr);
                  setIsDateModalOpen(true);
                }}
                className="p-3 bg-slate-900 border border-slate-800 text-indigo-400 rounded-2xl hover:bg-slate-800 transition-all cursor-pointer relative group"
                title="View Date Ledger Breakdown"
              >
                <CalendarIcon className="w-5 h-5" />
                <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-slate-800">
                  Date Ledger Breakdown
                </span>
              </button>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/50 shrink-0"
              />
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate">{user?.name}</span>
                  <span className="text-[11px] text-slate-400 truncate">{user?.email}</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Date Financial Breakdown Modal */}
      <DateDetailsModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        selectedDate={selectedDate}
      />
    </>
  );
};
