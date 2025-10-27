import { formatEther } from 'viem';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function for combining class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format FLR tokens for display
export function formatFLR(amount: bigint): string {
  return formatEther(amount);
}

// Format date/time for display
export function formatDateTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

// Calculate vesting progress percentage
export function calculateVestingProgress(
  startTime: bigint,
  duration: bigint,
  cliff: bigint
): number {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const cliffEnd = startTime + cliff;
  
  if (now < cliffEnd) {
    return 0;
  }
  
  const vestingStart = cliffEnd;
  const vestingEnd = startTime + duration;
  
  if (now >= vestingEnd) {
    return 100;
  }
  
  const elapsed = now - vestingStart;
  const totalVestingTime = vestingEnd - vestingStart;
  
  return Number((elapsed * BigInt(100)) / totalVestingTime);
}

// Get vesting status
export function getVestingStatus(
  startTime: bigint,
  duration: bigint,
  cliff: bigint,
  revoked: boolean
): 'pending' | 'active' | 'completed' | 'revoked' {
  if (revoked) return 'revoked';
  
  const now = BigInt(Math.floor(Date.now() / 1000));
  const cliffEnd = startTime + cliff;
  const vestingEnd = startTime + duration;
  
  if (now < cliffEnd) return 'pending';
  if (now >= vestingEnd) return 'completed';
  return 'active';
}

// Get next release date
export function getNextReleaseDate(
  startTime: bigint,
  duration: bigint,
  cliff: bigint
): Date | null {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const cliffEnd = startTime + cliff;
  
  if (now < cliffEnd) {
    return new Date(Number(cliffEnd) * 1000);
  }
  
  const vestingEnd = startTime + duration;
  if (now >= vestingEnd) {
    return null; // Vesting completed
  }
  
  // For active vesting, return the vesting end date
  return new Date(Number(vestingEnd) * 1000);
}