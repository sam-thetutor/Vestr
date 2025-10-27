'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader,
  Wallet,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useCreateVestingSchedule } from '@/hooks/useVestingContract';
import { useState, useMemo, useEffect } from 'react';
import { parseEther, formatEther } from 'viem';
import { ClientOnly } from '@/components/ClientOnly';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

interface FormData {
  beneficiary: string;
  totalAmount: string;
  startTime: string;
  duration: string;
  cliff: string;
  revocable: boolean;
}

export default function CreateVestingSchedulePage() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <CreateVestingScheduleContent />
    </ClientOnly>
  );
}

function CreateVestingScheduleContent() {
  const { authenticated, user } = usePrivy();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const createSchedule = useCreateVestingSchedule();
  
  const [formData, setFormData] = useState<FormData>({
    beneficiary: '',
    totalAmount: '',
    startTime: '', // Will be set to current time + 5 minutes
    duration: '365', // Default to 1 year
    cliff: '30', // Default to 30 days
    revocable: true,
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-fill beneficiary with user's wallet address
  useEffect(() => {
    if (address && !formData.beneficiary) {
      setFormData(prev => ({ ...prev, beneficiary: address }));
    }
  }, [address, formData.beneficiary]);

  // Set default start time (5 minutes from now)
  useEffect(() => {
    if (!formData.startTime) {
      const defaultStartTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      const isoString = defaultStartTime.toISOString().slice(0, 16); // Remove seconds and milliseconds
      setFormData(prev => ({ ...prev, startTime: isoString }));
    }
  }, [formData.startTime]);

  // Memoized validation
  const isValid = useMemo(() => {
    // Validate beneficiary address
    if (!formData.beneficiary || !/^0x[a-fA-F0-9]{40}$/.test(formData.beneficiary)) {
      return false;
    }

    // Validate total amount
    if (!formData.totalAmount || isNaN(Number(formData.totalAmount)) || Number(formData.totalAmount) <= 0) {
      return false;
    }

    // Check if user has enough balance
    if (balance && Number(formData.totalAmount) > Number(formatEther(balance.value))) {
      return false;
    }

    // Validate start time
    if (!formData.startTime) {
      return false;
    }
    const startTime = new Date(formData.startTime);
    const now = new Date();
    if (startTime <= now) {
      return false; // Start time must be in the future
    }

    // Validate duration
    if (!formData.duration || isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      return false;
    }

    // Validate cliff
    if (!formData.cliff || isNaN(Number(formData.cliff)) || Number(formData.cliff) < 0) {
      return false;
    } else if (Number(formData.cliff) > Number(formData.duration)) {
      return false;
    }

    return true;
  }, [formData, balance]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to create vesting schedules.</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || !address) {
      return;
    }

    setIsSubmitting(true);
    setTxHash(null);
    setIsSuccess(false);
    
    try {
      // Use the selected start time
      const startTimestamp = Math.floor(new Date(formData.startTime).getTime() / 1000);
      const durationSeconds = Number(formData.duration) * 24 * 60 * 60; // Convert days to seconds
      const cliffSeconds = Number(formData.cliff) * 24 * 60 * 60; // Convert days to seconds
      const totalAmountWei = parseEther(formData.totalAmount);

      const result = await createSchedule.mutateAsync({
        beneficiary: formData.beneficiary as `0x${string}`,
        totalAmount: totalAmountWei,
        startTime: BigInt(startTimestamp),
        duration: BigInt(durationSeconds),
        cliff: BigInt(cliffSeconds),
        revocable: formData.revocable,
      });

      setTxHash(result);
      setIsSuccess(true);

      // Redirect to schedules page after 3 seconds
      setTimeout(() => {
        window.location.href = '/dashboard/schedules';
      }, 3000);

    } catch (error: any) {
      console.error('Error creating vesting schedule:', error);
      
      // Extract more specific error message
      let errorMessage = 'Transaction failed. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient FLR balance for this transaction.';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas issues. Please try again.';
        } else if (error.message.includes('revert')) {
          errorMessage = 'Transaction reverted. Please check your parameters.';
        } else if (error.message.includes('start time')) {
          errorMessage = 'Invalid start time. Please try again.';
        } else {
          errorMessage = `Transaction failed: ${error.message}`;
        }
      }
      
      setErrors({ totalAmount: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const presetDurations = [
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
    { label: '2 Years', days: 730 },
    { label: '4 Years', days: 1460 },
  ];

  const presetCliffs = [
    { label: 'No Cliff', days: 0 },
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
  ];

  return (
    <DashboardLayout currentPage="create">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/dashboard/schedules'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedules
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Vesting Schedule</h1>
            <p className="text-gray-600 mt-2">
              Set up a new token vesting schedule on the blockchain
            </p>
          </div>
        </div>

        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Wallet Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Connected Address:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(address || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">FLR Balance:</span>
                <div className="text-lg font-semibold text-green-600">
                  {balance ? `${formatEther(balance.value)} FLR` : 'Loading...'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Beneficiary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Beneficiary Address</span>
              </CardTitle>
              <CardDescription>
                The address that will receive the vested tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="0x..."
                  value={formData.beneficiary}
                  onChange={(e) => handleInputChange('beneficiary', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.beneficiary ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.beneficiary && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.beneficiary}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Defaults to your connected wallet address
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Vesting Amount</span>
              </CardTitle>
              <CardDescription>
                Total FLR tokens to be vested
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="100.0"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    FLR
                  </div>
                </div>
                {errors.totalAmount && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.totalAmount}
                  </p>
                )}
                {balance && Number(formData.totalAmount) > Number(formatEther(balance.value)) && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Insufficient balance
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Start Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Start Time</span>
              </CardTitle>
              <CardDescription>
                When the vesting schedule should begin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.startTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)} // Minimum 5 minutes from now
                  />
                  <div className="text-sm text-gray-500">Select when vesting should start</div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
                      const isoString = now.toISOString().slice(0, 16);
                      handleInputChange('startTime', isoString);
                    }}
                    className={formData.startTime === new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16) ? 'bg-blue-50 border-blue-500' : ''}
                  >
                    Now + 5min
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
                      const isoString = tomorrow.toISOString().slice(0, 16);
                      handleInputChange('startTime', isoString);
                    }}
                  >
                    Tomorrow
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
                      const isoString = nextWeek.toISOString().slice(0, 16);
                      handleInputChange('startTime', isoString);
                    }}
                  >
                    Next Week
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Next month
                      const isoString = nextMonth.toISOString().slice(0, 16);
                      handleInputChange('startTime', isoString);
                    }}
                  >
                    Next Month
                  </Button>
                </div>
                
                {errors.startTime && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.startTime}
                  </p>
                )}
                {formData.startTime && new Date(formData.startTime) <= new Date() && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Start time must be in the future
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Vesting Duration</span>
              </CardTitle>
              <CardDescription>
                How long the vesting period lasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="365"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.duration ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="text-sm text-gray-500">Duration in days</div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {presetDurations.map((preset) => (
                    <Button
                      key={preset.days}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('duration', preset.days.toString())}
                      className={formData.duration === preset.days.toString() ? 'bg-blue-50 border-blue-500' : ''}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                
                {errors.duration && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.duration}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cliff Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Cliff Period</span>
              </CardTitle>
              <CardDescription>
                Time before any tokens can be released
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="30"
                    value={formData.cliff}
                    onChange={(e) => handleInputChange('cliff', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cliff ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="text-sm text-gray-500">Cliff period in days</div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {presetCliffs.map((preset) => (
                    <Button
                      key={preset.days}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('cliff', preset.days.toString())}
                      className={formData.cliff === preset.days.toString() ? 'bg-blue-50 border-blue-500' : ''}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                
                {errors.cliff && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.cliff}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revocable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Schedule Settings</span>
              </CardTitle>
              <CardDescription>
                Additional vesting schedule options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="revocable"
                  checked={formData.revocable}
                  onChange={(e) => handleInputChange('revocable', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="revocable" className="text-sm font-medium text-gray-700">
                  Allow contract owner to revoke this schedule
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Status */}
          {txHash && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span>Transaction Submitted</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-green-700">
                    Your vesting schedule has been created successfully!
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono bg-green-100 px-2 py-1 rounded">
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(txHash)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://coston2-explorer.flare.network/tx/${txHash}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600">
                    Redirecting to schedules page in 3 seconds...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 text-sm">Transaction Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Start Time: {formData.startTime ? new Date(formData.startTime).toLocaleString() : 'Not set'}</div>
                <div>Duration: {formData.duration} days</div>
                <div>Cliff: {formData.cliff} days</div>
                <div>Amount: {formData.totalAmount} FLR</div>
                <div>Revocable: {formData.revocable ? 'Yes' : 'No'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = '/dashboard/schedules'}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
