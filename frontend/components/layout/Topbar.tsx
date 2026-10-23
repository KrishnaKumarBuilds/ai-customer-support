'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/lib/api';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (e) {
      // silent fail
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markRead('all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-xl">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="w-4.5 h-4.5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      className={cn('px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer', !n.read && 'bg-primary/5')}
                    >
                      <div className="flex gap-2">
                        {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-medium leading-tight', !n.read ? 'text-foreground' : 'text-muted-foreground')}>
                            {n.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {user.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showNotifs && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
      )}
    </header>
  );
}
