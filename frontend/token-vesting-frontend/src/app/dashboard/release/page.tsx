'use client';

import { usePrivy } from '@privy-io/react-auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Download,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useUserVestingSchedules, useReleaseTokens } from '@/hooks/useVestingContract';
import { useState } from 'react';
import { ClientOnly } from '@/components/ClientOnly';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { VestingScheduleWithData } from '@/types/vesting';
import { formatFLR, formatDateTime } from '@/lib/utils';

export default function ReleaseTokensPage() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <ReleaseTokensContent />
    </ClientOnly>
  );
}

function ReleaseTokensContent() {
  const { authenticated, user } = usePrivy();
  const { data: schedules, isLoading, error, refetch } = useUserVestingSchedules();
  const releaseTokens = useReleaseTokens();
  
  const [isReleasing, setIsReleasing] = useState(false);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to release tokens.</p>
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

  const availableSchedules = schedules?.filter(schedule => 
    schedule.releasableAmount > BigInt(0) && schedule.status === 'active'
  ) || [];

  const totalReleasable = availableSchedules.reduce(
    (sum, schedule) => sum + schedule.releasableAmount, 
    BigInt(0)
  );

  const handleReleaseAll = async () => {
    if (totalReleasable === BigInt(0)) return;
    
    setIsReleasing(true);
    try {
      await releaseTokens.mutateAsync();
      // Refetch data after successful release
      refetch();
    } catch (error) {
      console.error('Error releasing tokens:', error);
    } finally {
      setIsReleasing(false);
    }
  };

  const handleReleaseSchedule = async (schedule: VestingScheduleWithData) => {
    setIsReleasing(true);
    try {
      await releaseTokens.mutateAsync();
      // Refetch data after successful release
      refetch();
    } catch (error) {
      console.error('Error releasing tokens:', error);
    } finally {
      setIsReleasing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout currentPage="release">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/dashboard'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Release Tokens</h1>
            <p className="text-gray-600 mt-2">
              Release your vested FLR tokens from active vesting schedules
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Release Summary</span>
            </CardTitle>
            <CardDescription>
              Overview of tokens available for release
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Download className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {formatFLR(totalReleasable)}
                </div>
                <div className="text-sm text-green-700">Available to Release</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {availableSchedules.length}
                </div>
                <div className="text-sm text-blue-700">Active Schedules</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {schedules?.length || 0}
                </div>
                <div className="text-sm text-purple-700">Total Schedules</div>
              </div>
            </div>

            {totalReleasable > BigInt(0) && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleReleaseAll}
                  disabled={isReleasing}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isReleasing ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Releasing...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Release All Tokens
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

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
        ) : schedules?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vesting Schedules</h3>
              <p className="text-gray-600 mb-6">
                You don't have any vesting schedules yet. Create your first schedule to get started.
              </p>
              <Button onClick={() => window.location.href = '/dashboard/create'}>
                Create Vesting Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules?.map((schedule) => (
              <Card key={schedule.beneficiary} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Vesting Schedule</CardTitle>
                      <CardDescription>
                        Beneficiary: {schedule.beneficiary.slice(0, 6)}...{schedule.beneficiary.slice(-4)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold">{formatFLR(schedule.totalAmount)}</div>
                      <div className="text-xs text-gray-600">Total Amount</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold">{formatFLR(schedule.vestedAmount)}</div>
                      <div className="text-xs text-gray-600">Vested Amount</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Download className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold">{formatFLR(schedule.releasableAmount)}</div>
                      <div className="text-xs text-gray-600">Available to Release</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold">{formatFLR(schedule.released)}</div>
                      <div className="text-xs text-gray-600">Already Released</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Vesting Progress</span>
                      <span className="text-sm font-medium">{schedule.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(schedule.progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  {schedule.releasableAmount > BigInt(0) ? (
                    <Button
                      onClick={() => handleReleaseSchedule(schedule)}
                      disabled={isReleasing}
                      className="w-full"
                    >
                      {isReleasing ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Releasing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Release {formatFLR(schedule.releasableAmount)} FLR
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>No tokens available for release</p>
                      <p className="text-sm">
                        {schedule.status === 'pending' 
                          ? 'Vesting has not started yet'
                          : schedule.status === 'completed'
                          ? 'All tokens have been released'
                          : 'Tokens are still vesting'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
