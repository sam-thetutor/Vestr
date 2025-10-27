'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { ContractService } from '@/lib/services/contractService';
import { getContractAddress } from '@/lib/contracts/addresses';

interface ContractStatusProps {
  onRefresh?: () => void;
}

export function ContractStatus({ onRefresh }: ContractStatusProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [contractInfo, setContractInfo] = useState<{
    isConnected: boolean;
    owner?: string;
    beneficiaryCount?: number;
    contractBalance?: string;
    error?: string;
  } | null>(null);

  const contractAddress = getContractAddress(114);

  const checkContractStatus = async () => {
    setIsChecking(true);
    try {
      const [owner, beneficiaryCount, contractBalance] = await Promise.all([
        ContractService.getOwner(),
        ContractService.getBeneficiaryCount(),
        ContractService.getContractBalance(),
      ]);

      setContractInfo({
        isConnected: true,
        owner,
        beneficiaryCount,
        contractBalance: contractBalance.toString(),
      });
    } catch (error) {
      setContractInfo({
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openInExplorer = () => {
    window.open(`https://coston2-explorer.flare.network/address/${contractAddress}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Contract Status</span>
              {contractInfo?.isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : contractInfo?.isConnected === false ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </CardTitle>
            <CardDescription>
              Token Vesting Contract on Flare Testnet
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkContractStatus}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check Status
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contract Address */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Contract Address</span>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(contractAddress)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInExplorer}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="font-mono text-sm bg-gray-100 p-2 rounded">
            {contractAddress}
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Connection Status</span>
          <Badge variant={contractInfo?.isConnected ? "default" : "destructive"}>
            {contractInfo?.isConnected ? "Connected" : contractInfo?.isConnected === false ? "Disconnected" : "Unknown"}
          </Badge>
        </div>

        {/* Contract Info */}
        {contractInfo?.isConnected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Contract Owner</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm">
                  {contractInfo.owner?.slice(0, 6)}...{contractInfo.owner?.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => contractInfo.owner && copyToClipboard(contractInfo.owner)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Beneficiaries</span>
              <Badge variant="outline">{contractInfo.beneficiaryCount || 0}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Contract Balance</span>
              <span className="text-sm font-mono">
                {contractInfo.contractBalance ? `${(Number(contractInfo.contractBalance) / 1e18).toFixed(4)} FLR` : '0 FLR'}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {contractInfo?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{contractInfo.error}</span>
            </div>
          </div>
        )}

        {/* Network Info */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Network</span>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Flare Testnet (Coston2)
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



