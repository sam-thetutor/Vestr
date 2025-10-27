'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Settings,
  Plus,
  List,
  Shield,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export function DashboardLayout({ children, currentPage = 'overview' }: DashboardLayoutProps) {
  const { authenticated, user, logout } = usePrivy();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please connect your wallet to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, href: '/dashboard' },
    { id: 'schedules', label: 'My Schedules', icon: Calendar, href: '/dashboard/schedules' },
    { id: 'create', label: 'Create Schedule', icon: Plus, href: '/dashboard/create' },
    { id: 'release', label: 'Release Tokens', icon: DollarSign, href: '/dashboard/release' },
    { id: 'admin', label: 'Admin Panel', icon: Shield, href: '/dashboard/admin' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/'}
                className="hidden sm:flex"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <span className="text-xl font-bold text-gray-900">Vestr</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Network Indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Flare Testnet</span>
              </div>
              
              {/* Wallet Address */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                  <Wallet className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600 font-mono">
                    {user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'Connected'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-4 border-b lg:hidden">
            <span className="text-lg font-semibold">Navigation</span>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              ×
            </Button>
          </div>
          
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      onClick={() => {
                        // Handle navigation
                        if (item.id === 'overview') window.location.href = '/dashboard';
                        else if (item.id === 'schedules') window.location.href = '/dashboard/schedules';
                        else if (item.id === 'create') window.location.href = '/dashboard/create';
                        else if (item.id === 'release') window.location.href = '/dashboard/release';
                        else if (item.id === 'admin') window.location.href = '/dashboard/admin';
                        else if (item.id === 'settings') window.location.href = '/dashboard/settings';
                      }}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Button */}
      <Button
        className="fixed bottom-4 right-4 lg:hidden z-40 rounded-full shadow-lg"
        size="lg"
        onClick={() => setSidebarOpen(true)}
      >
        <List className="h-5 w-5" />
      </Button>
    </div>
  );
}
