'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Ticket, Users, UserCheck, Settings, BarChart3,
  Tag, Clock, LogOut, Bot, Bell, ChevronRight, Zap
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/tickets', label: 'All Tickets', icon: <Ticket className="w-4 h-4" /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/agents', label: 'Agents', icon: <UserCheck className="w-4 h-4" /> },
  { href: '/admin/categories', label: 'Categories', icon: <Tag className="w-4 h-4" /> },
  { href: '/admin/sla', label: 'SLA Rules', icon: <Clock className="w-4 h-4" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
];

const agentNav: NavItem[] = [
  { href: '/agent/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/agent/tickets', label: 'My Tickets', icon: <Ticket className="w-4 h-4" /> },
  { href: '/agent/profile', label: 'Profile', icon: <UserCheck className="w-4 h-4" /> }
];

const customerNav: NavItem[] = [
  { href: '/customer/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/customer/tickets', label: 'My Tickets', icon: <Ticket className="w-4 h-4" /> },
  { href: '/customer/tickets/new', label: 'New Ticket', icon: <Bot className="w-4 h-4" /> },
  { href: '/customer/profile', label: 'Profile', icon: <Users className="w-4 h-4" /> }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = user?.role === 'ADMIN' ? adminNav
    : user?.role === 'AGENT' ? agentNav
    : customerNav;

  const roleLabel = user?.role === 'ADMIN' ? 'Administrator'
    : user?.role === 'AGENT' ? 'Support Agent'
    : 'Customer';

  const roleColor = user?.role === 'ADMIN' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    : user?.role === 'AGENT' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-border bg-card/50 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gradient">SupportIQ</h1>
          <p className="text-[10px] text-muted-foreground">AI-Powered Support</p>
        </div>
      </div>

      {/* User Role Badge */}
      {user && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border', roleColor)}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/agent/dashboard' && item.href !== '/customer/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-item', isActive && 'active')}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="sidebar-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-400/5"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          SupportIQ v1.0 — AI Ticketing
        </p>
      </div>
    </aside>
  );
}
