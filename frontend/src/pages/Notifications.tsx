import React, { useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, DollarSign, UserPlus, Calendar, Info, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const filtered = notifications.filter((n) => (filter === 'Unread' ? !n.read : true));

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'Overdue':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'Payment':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'Customer':
        return <UserPlus className="w-5 h-5 text-indigo-400" />;
      case 'EMI':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Notification Alerts Center</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            System alerts for upcoming EMIs, overdue collections, and new onboarding ({unreadCount} unread)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('Unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'Unread' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
            <p className="text-sm font-medium text-slate-400">No notification alerts available</p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-5 rounded-2xl border transition-all relative group cursor-pointer ${
                notif.read
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-75 hover:opacity-100'
                  : 'bg-slate-800/80 border-indigo-500/30 shadow-lg'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                  {getNotifIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-white">{notif.title}</h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(notif.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Delete Individual Notification Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all absolute top-4 right-4 cursor-pointer"
                  title="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Dialog for Clear All */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notification alerts?"
        confirmText="Delete All"
        isDanger
        onConfirm={async () => {
          await clearAllNotifications();
          setIsClearConfirmOpen(false);
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};
