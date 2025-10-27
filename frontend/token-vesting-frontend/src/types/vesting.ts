// Vesting schedule structure from contract
export interface VestingSchedule {
  initialized: boolean;
  revocable: boolean;
  totalAmount: bigint;
  startTime: bigint;
  duration: bigint;
  cliff: bigint;
  released: bigint;
  revoked: boolean;
}

// Vesting schedule with additional calculated data
export interface VestingScheduleWithData extends VestingSchedule {
  beneficiary: string;
  vestedAmount: bigint;
  releasableAmount: bigint;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'revoked';
  nextReleaseDate: Date | null;
}

// Parameters for creating a vesting schedule
export interface CreateVestingScheduleParams {
  beneficiary: string;
  totalAmount: bigint;
  startTime: bigint;
  duration: bigint;
  cliff: bigint;
  revocable: boolean;
}

// Dashboard overview data
export interface DashboardData {
  totalVested: bigint;
  totalReleased: bigint;
  totalAvailable: bigint;
  activeSchedules: number;
  completedSchedules: number;
  nextReleaseDate?: Date;
}

// Admin data
export interface AdminData {
  owner: string;
  feeRecipient: string;
  setupFeePercentage: bigint;
  totalBeneficiaries: bigint;
  contractBalance: bigint;
}