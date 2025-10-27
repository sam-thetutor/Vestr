import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { flareTestnet } from 'wagmi/chains';
import { TokenVestingABI } from '@/lib/contracts/TokenVesting';
import { getContractAddress } from '@/lib/contracts/addresses';

// Create a public client for reading contract data
const publicClient = createPublicClient({
  chain: flareTestnet,
  transport: http('https://coston2-api.flare.network/ext/bc/C/rpc'),
});

// Contract configuration
const contractConfig = {
  address: getContractAddress(114) as `0x${string}`,
  abi: TokenVestingABI,
};

export interface ContractVestingSchedule {
  initialized: boolean;
  revocable: boolean;
  totalAmount: bigint;
  startTime: bigint;
  duration: bigint;
  cliff: bigint;
  released: bigint;
  revoked: boolean;
}

export class ContractService {
  // Check if a beneficiary has a vesting schedule
  static async hasVestingSchedule(beneficiary: string): Promise<boolean> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'hasVestingSchedule',
        args: [beneficiary as `0x${string}`],
      });
      return result as boolean;
    } catch (error) {
      console.error('Error checking vesting schedule:', error);
      return false;
    }
  }

  // Get vesting schedule for a beneficiary
  static async getVestingSchedule(beneficiary: string): Promise<ContractVestingSchedule | null> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'vestingSchedules',
        args: [beneficiary as `0x${string}`],
      });
      
      const schedule = result as [
        boolean, boolean, bigint, bigint, bigint, bigint, bigint, boolean
      ];
      
      return {
        initialized: schedule[0],
        revocable: schedule[1],
        totalAmount: schedule[2],
        startTime: schedule[3],
        duration: schedule[4],
        cliff: schedule[5],
        released: schedule[6],
        revoked: schedule[7],
      };
    } catch (error) {
      console.error('Error getting vesting schedule:', error);
      return null;
    }
  }

  // Get vested amount for a beneficiary
  static async getVestedAmount(beneficiary: string): Promise<bigint> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getVestedAmount',
        args: [beneficiary as `0x${string}`],
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting vested amount:', error);
      return BigInt(0);
    }
  }

  // Get releasable amount for a beneficiary
  static async getReleasableAmount(beneficiary: string): Promise<bigint> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getReleasableAmount',
        args: [beneficiary as `0x${string}`],
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting releasable amount:', error);
      return BigInt(0);
    }
  }

  // Get total number of beneficiaries
  static async getBeneficiaryCount(): Promise<number> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getBeneficiaryCount',
      });
      return Number(result as bigint);
    } catch (error) {
      console.error('Error getting beneficiary count:', error);
      return 0;
    }
  }

  // Get beneficiary at index
  static async getBeneficiary(index: number): Promise<string> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getBeneficiary',
        args: [BigInt(index)],
      });
      return result as string;
    } catch (error) {
      console.error('Error getting beneficiary:', error);
      return '';
    }
  }

  // Get contract owner
  static async getOwner(): Promise<string> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'owner',
      });
      return result as string;
    } catch (error) {
      console.error('Error getting owner:', error);
      return '';
    }
  }

  // Get fee recipient
  static async getFeeRecipient(): Promise<string> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'feeRecipient',
      });
      return result as string;
    } catch (error) {
      console.error('Error getting fee recipient:', error);
      return '';
    }
  }

  // Get setup fee percentage
  static async getSetupFeePercentage(): Promise<bigint> {
    try {
      const result = await publicClient.readContract({
        ...contractConfig,
        functionName: 'setupFeePercentage',
      });
      return result as bigint;
    } catch (error) {
      console.error('Error getting setup fee percentage:', error);
      return BigInt(0);
    }
  }

  // Get contract balance (this would need to be implemented in the contract)
  static async getContractBalance(): Promise<bigint> {
    try {
      const balance = await publicClient.getBalance({
        address: contractConfig.address,
      });
      return balance;
    } catch (error) {
      console.error('Error getting contract balance:', error);
      return BigInt(0);
    }
  }

  // Get all beneficiaries with their vesting schedules
  static async getAllBeneficiaries(): Promise<Array<{
    address: string;
    schedule: ContractVestingSchedule | null;
    vestedAmount: bigint;
    releasableAmount: bigint;
  }>> {
    try {
      const count = await this.getBeneficiaryCount();
      const beneficiaries = [];

      for (let i = 0; i < count; i++) {
        const address = await this.getBeneficiary(i);
        const schedule = await this.getVestingSchedule(address);
        const vestedAmount = await this.getVestedAmount(address);
        const releasableAmount = await this.getReleasableAmount(address);

        beneficiaries.push({
          address,
          schedule,
          vestedAmount,
          releasableAmount,
        });
      }

      return beneficiaries;
    } catch (error) {
      console.error('Error getting all beneficiaries:', error);
      return [];
    }
  }
}
