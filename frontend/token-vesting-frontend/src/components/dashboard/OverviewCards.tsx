'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Clock,
  Wallet,
  Activity
} from 'lucide-react';
import { formatFLR } from '@/lib/utils';

interface OverviewCardsProps {
  data?: {
    totalVested: bigint;
    totalReleased: bigint;
    totalAvailable: bigint;
    activeSchedules: number;
    completedSchedules: number;
    nextReleaseDate?: Date;
  } | null;
  loading?: boolean;
}

export function OverviewCards({ data, loading = false }: OverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Vested",
      value: data ? formatFLR(data.totalVested) : "0",
      unit: "FLR",
      description: data?.activeSchedules ? `${data.activeSchedules} active schedules` : "No active schedules",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Total Released",
      value: data ? formatFLR(data.totalReleased) : "0",
      unit: "FLR",
      description: "Successfully claimed tokens",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Available to Release",
      value: data ? formatFLR(data.totalAvailable) : "0",
      unit: "FLR",
      description: "Ready for immediate release",
      icon: Wallet,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Next Release",
      value: data?.nextReleaseDate ? 
        data.nextReleaseDate.toLocaleDateString() : 
        "No upcoming releases",
      unit: "",
      description: data?.nextReleaseDate ? 
        `in ${Math.ceil((data.nextReleaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days` : 
        "All schedules completed",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-1">
                <div className="text-2xl font-bold text-gray-900">
                  {card.value}
                </div>
                {card.unit && (
                  <span className="text-sm text-gray-500">
                    {card.unit}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
