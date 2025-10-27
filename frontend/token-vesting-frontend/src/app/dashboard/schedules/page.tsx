'use client';

import { usePrivy } from '@privy-io/react-auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { VestingScheduleCard } from '@/components/dashboard/VestingScheduleCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useUserVestingSchedules, useReleaseTokens, useRevokeVestingSchedule } from '@/hooks/useVestingContract';
import { useState } from 'react';
import { VestingScheduleWithData } from '@/types/vesting';
import { ClientOnly } from '@/components/ClientOnly';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function VestingSchedulesPage() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <VestingSchedulesContent />
    </ClientOnly>
  );
}

function VestingSchedulesContent() {
  const { authenticated, user } = usePrivy();
  const { data: schedules, isLoading, error, refetch } = useUserVestingSchedules();
  const releaseTokens = useReleaseTokens();
  const revokeSchedule = useRevokeVestingSchedule();
  
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'revoked' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to view vesting schedules.</p>
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

  const filteredSchedules = schedules?.filter(schedule => {
    const matchesFilter = filter === 'all' || schedule.status === filter;
    const matchesSearch = searchTerm === '' || 
      schedule.beneficiary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const handleRelease = async (schedule: VestingScheduleWithData) => {
    try {
      await releaseTokens.mutateAsync();
      // Refetch data after successful release
      refetch();
    } catch (error) {
      console.error('Error releasing tokens:', error);
    }
  };

  const handleRevoke = async (schedule: VestingScheduleWithData) => {
    try {
      await revokeSchedule.mutateAsync(schedule.beneficiary);
      // Refetch data after successful revocation
      refetch();
    } catch (error) {
      console.error('Error revoking schedule:', error);
    }
  };

  const handleViewDetails = (schedule: VestingScheduleWithData) => {
    // TODO: Navigate to detailed view
    console.log('View details for:', schedule);
  };

  const getStatusCounts = () => {
    if (!schedules) return { active: 0, completed: 0, revoked: 0, pending: 0 };
    
    return schedules.reduce((counts, schedule) => {
      counts[schedule.status] = (counts[schedule.status] || 0) + 1;
      return counts;
    }, { active: 0, completed: 0, revoked: 0, pending: 0 } as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout currentPage="schedules">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Vesting Schedules</h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor your token vesting schedules
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => window.location.href = '/dashboard/create'}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedules?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {statusCounts.active} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
              <p className="text-xs text-muted-foreground">
                Currently vesting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statusCounts.completed}</div>
              <p className="text-xs text-muted-foreground">
                Fully vested
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revoked</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statusCounts.revoked}</div>
              <p className="text-xs text-muted-foreground">
                Cancelled schedules
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex space-x-2">
                {(['all', 'active', 'completed', 'revoked', 'pending'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== 'all' && (
                      <Badge variant="secondary" className="ml-2">
                        {statusCounts[status] || 0}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by beneficiary address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedules List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Schedules</h3>
              <p className="text-gray-600 mb-4">
                There was an error loading your vesting schedules. Please try again.
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredSchedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {schedules?.length === 0 ? 'No Vesting Schedules' : 'No Matching Schedules'}
              </h3>
              <p className="text-gray-600 mb-6">
                {schedules?.length === 0 
                  ? "You don't have any vesting schedules yet. Create your first schedule to get started."
                  : "No schedules match your current filters. Try adjusting your search criteria."
                }
              </p>
              {schedules?.length === 0 && (
                <Button onClick={() => window.location.href = '/dashboard/create'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Schedule
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSchedules.map((schedule) => (
              <VestingScheduleCard
                key={schedule.beneficiary}
                schedule={schedule}
                onRelease={() => handleRelease(schedule)}
                onViewDetails={() => handleViewDetails(schedule)}
                onRevoke={() => handleRevoke(schedule)}
                isOwner={false} // TODO: Implement owner detection
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
