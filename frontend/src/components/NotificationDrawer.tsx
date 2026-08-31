import React from 'react';
import { X, CheckCheck, Bell, AlertTriangle, DollarSign, UserPlus, Calendar, Info, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    closeDrawer,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  if (!isDrawerOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeDrawer}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-up text-white">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Read All
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
                <p className="text-sm font-medium text-slate-400">No notifications right now</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 rounded-xl border transition-all relative group cursor-pointer ${
                    notif.read
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-75 hover:opacity-100'
                      : 'bg-slate-800/80 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-slate-800 shrink-0 border border-slate-700">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(notif.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    {/* Delete Individual Notification */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover:opacity-100 absolute top-3 right-3 cursor-pointer"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
