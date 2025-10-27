'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Download,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react';
import { VestingScheduleWithData } from '@/types/vesting';
import { formatFLR, formatDateTime } from '@/lib/utils';
import { useState } from 'react';

interface VestingScheduleCardProps {
  schedule: VestingScheduleWithData;
  onRelease?: () => void;
  onViewDetails?: () => void;
  isOwner?: boolean;
  onRevoke?: () => void;
}

export function VestingScheduleCard({ 
  schedule, 
  onRelease, 
  onViewDetails,
  isOwner = false,
  onRevoke 
}: VestingScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'revoked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
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

  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / (24 * 60 * 60);
    if (days < 1) return `${Math.round(days * 24)} hours`;
    if (days < 30) return `${Math.round(days)} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const formatCliff = (seconds: bigint) => {
    const days = Number(seconds) / (24 * 60 * 60);
    if (days < 1) return `${Math.round(days * 24)} hours`;
    if (days < 30) return `${Math.round(days)} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(schedule.status)}
            <div>
              <CardTitle className="text-lg">
                Vesting Schedule
              </CardTitle>
              <CardDescription>
                Beneficiary: {schedule.beneficiary.slice(0, 6)}...{schedule.beneficiary.slice(-4)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(schedule.status)}>
              {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
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
            <DollarSign className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <div className="text-lg font-semibold">{formatFLR(schedule.released)}</div>
            <div className="text-xs text-gray-600">Already Released</div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Start Date:</span>
                <div>{formatDateTime(schedule.startTime)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Duration:</span>
                <div>{formatDuration(schedule.duration)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Cliff Period:</span>
                <div>{formatCliff(schedule.cliff)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Revocable:</span>
                <div>{schedule.revocable ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {schedule.nextReleaseDate && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Next Release: {schedule.nextReleaseDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              {schedule.releasableAmount > BigInt(0) && (
                <Button 
                  onClick={onRelease}
                  className="flex-1"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Release {formatFLR(schedule.releasableAmount)} FLR
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={onViewDetails}
                size="sm"
              >
                View Details
              </Button>

              {isOwner && schedule.revocable && schedule.status === 'active' && (
                <Button 
                  variant="destructive" 
                  onClick={onRevoke}
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions (Collapsed) */}
        {!isExpanded && (
          <div className="flex space-x-2">
            {schedule.releasableAmount > BigInt(0) && (
              <Button 
                onClick={onRelease}
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Release Tokens
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onViewDetails}
              size="sm"
            >
              Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



