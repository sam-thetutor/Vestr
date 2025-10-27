'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock, DollarSign, Users } from 'lucide-react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { ClientOnly } from '@/components/ClientOnly';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <HomeContent />
    </ClientOnly>
  );
}

function HomeContent() {
  
  const { isConnected, address, connect, disconnect, ready, useWagmiFallback, chainId, isCorrectNetwork } = useWalletConnection();

  const handleLogin = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <span className="text-xl font-bold text-gray-900">Vestr</span>
            </div>
            <div className="flex items-center space-x-4">
              {!ready ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : isConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                    </span>
                    {!isCorrectNetwork && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        Wrong Network
                      </span>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={disconnect}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={handleLogin}>
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900">
            Secure Token Vesting on{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flare Network
            </span>
          </h1>
          <p className="mb-8 text-xl text-gray-600 max-w-3xl mx-auto">
            Create flexible vesting schedules for your FLR tokens with our secure, 
            gas-efficient smart contract. Perfect for teams, advisors, and long-term token holders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={isConnected ? () => window.location.href = '/dashboard' : handleLogin}>
              {isConnected ? 'Go to Dashboard' : 'Get Started'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Why Choose Our Token Vesting?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Secure & Audited</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built with OpenZeppelin standards and thoroughly tested. 
                  Your tokens are safe with our battle-tested smart contract.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Flexible Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create custom vesting schedules with cliff periods, 
                  linear or exponential release patterns to fit your needs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Cost Effective</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Low setup fees and gas-efficient operations on Flare network. 
                  Save on transaction costs while maintaining security.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Team Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Perfect for team token distribution, advisor rewards, 
                  and long-term incentive programs.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Connect Wallet</h3>
              <p className="text-gray-600">
                Connect your Flare wallet to access the vesting platform securely.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-600">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Create Schedule</h3>
              <p className="text-gray-600">
                Set up your vesting schedule with custom parameters like duration and cliff period.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Release Tokens</h3>
              <p className="text-gray-600">
                Tokens automatically vest over time and can be released when available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white">
            Ready to Start Vesting?
          </h2>
          <p className="mb-8 text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of users who trust our platform for secure token vesting on Flare network.
          </p>
          <Button size="lg" variant="secondary" onClick={isConnected ? () => window.location.href = '/dashboard' : handleLogin}>
            {isConnected ? 'Access Dashboard' : 'Connect Wallet & Start'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <div className="h-6 w-6 rounded bg-gradient-to-r from-blue-600 to-purple-600"></div>
            <span className="text-lg font-bold">Token Vesting</span>
          </div>
          <p className="text-gray-400">
            Secure token vesting on Flare Network. Built with ❤️ for the community.
          </p>
        </div>
      </footer>
    </div>
  );
}