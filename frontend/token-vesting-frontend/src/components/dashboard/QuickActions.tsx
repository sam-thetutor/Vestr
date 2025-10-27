'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  Settings,
  TrendingUp,
  Shield
} from 'lucide-react';

interface QuickActionsProps {
  onCreateSchedule?: () => void;
  onReleaseTokens?: () => void;
  onViewSchedules?: () => void;
  onAdminPanel?: () => void;
  isOwner?: boolean;
}

export function QuickActions({ 
  onCreateSchedule, 
  onReleaseTokens, 
  onViewSchedules,
  onAdminPanel,
  isOwner = false 
}: QuickActionsProps) {
  const actions = [
    {
      title: "Create Vesting Schedule",
      description: "Set up a new vesting schedule for FLR tokens",
      icon: Plus,
      onClick: onCreateSchedule || (() => window.location.href = '/dashboard/create'),
      variant: "default" as const,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Release Available Tokens",
      description: "Claim tokens that are ready for release",
      icon: DollarSign,
      onClick: onReleaseTokens || (() => window.location.href = '/dashboard/release'),
      variant: "outline" as const,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "View All Schedules",
      description: "Manage and monitor your vesting schedules",
      icon: Calendar,
      onClick: onViewSchedules || (() => window.location.href = '/dashboard/schedules'),
      variant: "outline" as const,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  // Add admin action if user is owner
  if (isOwner) {
    actions.push({
      title: "Admin Panel",
      description: "Manage contract settings and beneficiaries",
      icon: Shield,
      onClick: onAdminPanel || (() => window.location.href = '/dashboard/admin'),
      variant: "outline" as const,
      color: "text-red-600",
      bgColor: "bg-red-100"
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${action.bgColor} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant={action.variant} 
                className="w-full"
                onClick={action.onClick}
              >
                {action.title}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
