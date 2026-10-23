'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
