import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/ToastProvider';

export const metadata: Metadata = {
  title: 'SupportIQ — AI-Powered Customer Support',
  description: 'Enterprise-grade AI-powered customer support ticketing system with intelligent routing, SLA tracking, and real-time analytics.',
  keywords: 'customer support, ticketing system, AI, machine learning, SLA',
  authors: [{ name: 'SupportIQ Team' }],
  openGraph: {
    title: 'SupportIQ — AI-Powered Customer Support',
    description: 'Enterprise customer support platform with AI ticket classification and routing.',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
