import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseEther, formatEther } from 'viem';
import { TokenVestingABI } from '@/lib/contracts/TokenVesting';
import { getContractAddress } from '@/lib/contracts/addresses';
import { ContractService } from '@/lib/services/contractService';
import { 
  VestingSchedule, 
  VestingScheduleWithData, 
  CreateVestingScheduleParams,
  DashboardData,
  AdminData 
} from '@/types/vesting';
import { 
  calculateVestingProgress, 
  getVestingStatus, 
  getNextReleaseDate 
} from '@/lib/utils';

// Contract configuration
const contractConfig = {
  address: getContractAddress(114) as `0x${string}`,
  abi: TokenVestingABI,
};

// Hook to get vesting schedule for a beneficiary
export function useVestingSchedule(beneficiary: string) {
  return useQuery({
    queryKey: ['vestingSchedule', beneficiary],
    queryFn: async () => {
      if (!beneficiary) return null;
      
      const hasSchedule = await ContractService.hasVestingSchedule(beneficiary);
      if (!hasSchedule) return null;
      
      const [schedule, vestedAmount, releasableAmount] = await Promise.all([
        ContractService.getVestingSchedule(beneficiary),
        ContractService.getVestedAmount(beneficiary),
        ContractService.getReleasableAmount(beneficiary),
      ]);
      
      if (!schedule) return null;
      
      const progress = calculateVestingProgress(
        schedule.startTime,
        schedule.duration,
        schedule.cliff
      );
      
      const status = getVestingStatus(
        schedule.startTime,
        schedule.duration,
        schedule.cliff,
        schedule.revoked
      );
      
      const nextReleaseDate = getNextReleaseDate(
        schedule.startTime,
        schedule.duration,
        schedule.cliff
      );
      
      return {
        ...schedule,
        beneficiary,
        vestedAmount,
        releasableAmount,
        progress,
        status,
        nextReleaseDate,
      } as VestingScheduleWithData;
    },
    enabled: !!beneficiary,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook to get all vesting schedules for a user
export function useUserVestingSchedules() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['userVestingSchedules', address],
    queryFn: async () => {
      if (!address) return [];
      
      try {
        // Get total number of beneficiaries
        const beneficiaryCount = await ContractService.getBeneficiaryCount();
        
        if (beneficiaryCount === 0) return [];
        
        // Get all beneficiaries
        const beneficiaries: string[] = [];
        for (let i = 0; i < beneficiaryCount; i++) {
          const beneficiary = await ContractService.getBeneficiary(i);
          if (beneficiary) {
            beneficiaries.push(beneficiary);
          }
        }
        
        // Filter beneficiaries that match the current user's address
        const userBeneficiaries = beneficiaries.filter(b => 
          b.toLowerCase() === address.toLowerCase()
        );
        
        if (userBeneficiaries.length === 0) return [];
        
        // Fetch vesting schedule data for each beneficiary
        const schedules: VestingScheduleWithData[] = [];
        
        for (const beneficiary of userBeneficiaries) {
          const hasSchedule = await ContractService.hasVestingSchedule(beneficiary);
          if (!hasSchedule) continue;
          
          const [schedule, vestedAmount, releasableAmount] = await Promise.all([
            ContractService.getVestingSchedule(beneficiary),
            ContractService.getVestedAmount(beneficiary),
            ContractService.getReleasableAmount(beneficiary),
          ]);
          
          if (!schedule) continue;
          
          const progress = calculateVestingProgress(
            schedule.startTime,
            schedule.duration,
            schedule.cliff
          );
          
          const status = getVestingStatus(
            schedule.startTime,
            schedule.duration,
            schedule.cliff,
            schedule.revoked
          );
          
          const nextReleaseDate = getNextReleaseDate(
            schedule.startTime,
            schedule.duration,
            schedule.cliff
          );
          
          schedules.push({
            ...schedule,
            beneficiary,
            vestedAmount,
            releasableAmount,
            progress,
            status,
            nextReleaseDate,
          });
        }
        
        return schedules;
      } catch (error) {
        console.error('Error fetching user vesting schedules:', error);
        return [];
      }
    },
    enabled: !!address,
    refetchInterval: 30000,
  });
}

// Hook to get dashboard data
export function useDashboardData() {
  const { data: schedules } = useUserVestingSchedules();
  
  return useQuery({
    queryKey: ['dashboardData', schedules?.length], // Use length instead of full schedules object
    queryFn: () => {
      if (!schedules) return null;
      
      const totalVested = schedules.reduce((sum, schedule) => sum + schedule.vestedAmount, BigInt(0));
      const totalReleased = schedules.reduce((sum, schedule) => sum + schedule.released, BigInt(0));
      const totalAvailable = schedules.reduce((sum, schedule) => sum + schedule.releasableAmount, BigInt(0));
      const activeSchedules = schedules.filter(s => s.status === 'active').length;
      const completedSchedules = schedules.filter(s => s.status === 'completed').length;
      
      const nextReleaseDate = schedules
        .filter(s => s.nextReleaseDate)
        .sort((a, b) => (a.nextReleaseDate?.getTime() || 0) - (b.nextReleaseDate?.getTime() || 0))[0]?.nextReleaseDate;
      
      return {
        totalVested,
        totalReleased,
        totalAvailable,
        activeSchedules,
        completedSchedules,
        nextReleaseDate,
      } as DashboardData;
    },
    enabled: !!schedules,
  });
}

// Hook to create vesting schedule
export function useCreateVestingSchedule() {
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateVestingScheduleParams) => {
      try {
        console.log('Creating vesting schedule with params:', params);
        
        // Calculate the total amount including setup fee
        // The contract expects the total amount to be sent as FLR value
        const totalAmountWithFee = params.totalAmount;
        
        // Call the createVestingSchedule function on the contract
        const txHash = await writeContractAsync({
          ...contractConfig,
          functionName: 'createVestingSchedule',
          args: [
            params.beneficiary as `0x${string}`,
            params.totalAmount,
            params.startTime,
            params.duration,
            params.cliff,
            params.revocable,
          ],
          value: totalAmountWithFee, // Send FLR tokens as the vesting amount
        });
        
        console.log('Transaction submitted:', txHash);
        return txHash;
      } catch (error) {
        console.error('Error creating vesting schedule:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVestingSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
}

// Hook to release tokens
export function useReleaseTokens() {
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        console.log('Releasing tokens...');
        
        // Call the release function on the contract
        const txHash = await writeContractAsync({
          ...contractConfig,
          functionName: 'release',
          args: [],
        });
        
        console.log('Release transaction submitted:', txHash);
        return txHash;
      } catch (error) {
        console.error('Error releasing tokens:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVestingSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['vestingSchedule'] });
    },
  });
}

// Hook to get admin data
export function useAdminData() {
  return useQuery({
    queryKey: ['adminData'],
    queryFn: async () => {
      const [owner, feeRecipient, setupFeePercentage, totalBeneficiaries, contractBalance] = await Promise.all([
        ContractService.getOwner(),
        ContractService.getFeeRecipient(),
        ContractService.getSetupFeePercentage(),
        ContractService.getBeneficiaryCount(),
        ContractService.getContractBalance(),
      ]);
      
      return {
        owner,
        feeRecipient,
        setupFeePercentage,
        totalBeneficiaries: BigInt(totalBeneficiaries),
        contractBalance,
      } as AdminData;
    },
    refetchInterval: 30000,
  });
}

// Hook to update setup fee percentage
export function useUpdateSetupFeePercentage() {
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newFeePercentage: bigint) => {
      const hash = await writeContractAsync({
        ...contractConfig,
        functionName: 'updateSetupFeePercentage',
        args: [newFeePercentage],
      });
      
      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminData'] });
    },
  });
}

// Hook to update fee recipient
export function useUpdateFeeRecipient() {
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newFeeRecipient: string) => {
      const hash = await writeContractAsync({
        ...contractConfig,
        functionName: 'updateFeeRecipient',
        args: [newFeeRecipient as `0x${string}`],
      });
      
      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminData'] });
    },
  });
}

// Hook to revoke vesting schedule
export function useRevokeVestingSchedule() {
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (beneficiary: string) => {
      try {
        console.log('Revoking vesting schedule for:', beneficiary);
        
        // Call the revokeVestingSchedule function on the contract
        const txHash = await writeContractAsync({
          ...contractConfig,
          functionName: 'revokeVestingSchedule',
          args: [beneficiary as `0x${string}`],
        });
        
        console.log('Revoke transaction submitted:', txHash);
        return txHash;
      } catch (error) {
        console.error('Error revoking vesting schedule:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVestingSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['vestingSchedule'] });
    },
  });
}