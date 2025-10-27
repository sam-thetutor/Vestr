'use client';

import { usePrivy } from '@privy-io/react-auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ContractStatus } from '@/components/dashboard/ContractStatus';
import { useDashboardData, useAdminData } from '@/hooks/useVestingContract';
import { ClientOnly } from '@/components/ClientOnly';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <DashboardContent />
    </ClientOnly>
  );
}

function DashboardContent() {
  const { authenticated, user } = usePrivy();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData();
  const { data: adminData, isLoading: adminLoading } = useAdminData();
  
  // Check if user is contract owner
  const isOwner = Boolean(adminData && user?.wallet?.address && 
    adminData.owner.toLowerCase() === user.wallet.address.toLowerCase());

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the dashboard.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout currentPage="overview">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h1>
          <p className="text-gray-600">
            Manage your token vesting schedules and track your FLR tokens.
          </p>
        </div>

        {/* Overview Cards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <OverviewCards data={dashboardData} loading={dashboardLoading} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <QuickActions isOwner={isOwner} />
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <ActivityFeed 
            activities={[]} // TODO: Implement real activity data
            loading={false}
          />
        </div>

        {/* Contract Status */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Information</h2>
          <ContractStatus />
        </div>
      </div>
    </DashboardLayout>
  );
}
