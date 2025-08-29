'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  ArrowRightLeft, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
  Clock,
  Target
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage, setLocalStorage } from '@/lib/utils';
import type { Bootstrap, EntryHistory } from '@/lib/types';

interface TransferSummary {
  gameweek: number;
  transferCount: number;
  transferCost: number;
  points: number;
  rank: number;
  isHit: boolean;
}

export default function TransfersPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [entryId, setEntryId] = useState<string>('');
  const [transferSummary, setTransferSummary] = useState<TransferSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTransferPoints, setTotalTransferPoints] = useState(0);
  const [totalHitsCost, setTotalHitsCost] = useState(0);
  const [successfulHits, setSuccessfulHits] = useState(0);

  useEffect(() => {
    const savedEntryId = getLocalStorage('entryId');
    if (savedEntryId) {
      setEntryId(savedEntryId);
    }
  }, []);

  const handleSubmit = async () => {
    if (!entryId.trim()) {
      setError('Please enter a valid entry ID');
      return;
    }

    setLocalStorage('entryId', entryId);
    await fetchTransferData();
  };

  const fetchTransferData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!entryId) {
        throw new Error('Entry ID is required');
      }

      // Fetch bootstrap data and entry history (instead of transfers which requires auth)
      const [bootstrapResponse, historyResponse] = await Promise.all([
        fetch('/api/fpl/bootstrap'),
        fetch(`/api/fpl/entry/${entryId}/history`)
      ]);

      if (!bootstrapResponse.ok) throw new Error('Failed to fetch game data');
      if (!historyResponse.ok) throw new Error('Failed to fetch entry history');

      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      const historyData: EntryHistory = await historyResponse.json();

      setBootstrap(bootstrapData);

      // Generate real transfer summary from history data
      const summary = generateTransferSummary(bootstrapData, historyData);
      setTransferSummary(summary);

      // Calculate summary stats from real data
      const totalCost = summary.reduce((sum, t) => sum + t.transferCost, 0);
      const hitsCount = summary.filter(t => t.isHit).length;
      const totalTransfers = summary.reduce((sum, t) => sum + t.transferCount, 0);

      setTotalTransferPoints(totalTransfers);
      setTotalHitsCost(totalCost);
      setSuccessfulHits(hitsCount);

    } catch (err) {
      console.error('Transfer data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateTransferSummary = (
    bootstrap: Bootstrap,
    history: EntryHistory
  ): TransferSummary[] => {
    const summary: TransferSummary[] = [];

    // Use only real data from history
    history.current.forEach((gwData) => {
      summary.push({
        gameweek: gwData.event,
        transferCount: gwData.event_transfers,
        transferCost: gwData.event_transfers_cost,
        points: gwData.points,
        rank: gwData.rank,
        isHit: gwData.event_transfers_cost > 0,
      });
    });

    return summary.sort((a, b) => b.gameweek - a.gameweek);
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transfer Impact Analysis</h1>
        <p className="text-muted-foreground">
          Track the effectiveness of your transfer decisions
        </p>
      </div>

      {/* Entry ID Input */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Your FPL Entry ID</CardTitle>
          <CardDescription>
            Your FPL entry ID can be found in the URL of your team page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="e.g., 1234567"
              value={entryId}
              onChange={(e) => setEntryId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !entryId.trim()}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {transferSummary.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalTransferPoints)}</div>
                <p className="text-xs text-muted-foreground">
                  Transfers made
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Cost</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">-{formatNumber(totalHitsCost)}</div>
                <p className="text-xs text-muted-foreground">
                  From hits taken
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gameweeks with Hits</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(successfulHits)}</div>
                <p className="text-xs text-muted-foreground">
                  {transferSummary.length > 0 ? 
                    formatNumber((successfulHits / transferSummary.length) * 100, 0) + '% of gameweeks' : 
                    'No data'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gameweeks Tracked</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(transferSummary.length)}</div>
                <p className="text-xs text-muted-foreground">
                  Season progress
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transfer Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Summary by Gameweek</CardTitle>
              <CardDescription>
                Your transfer activity and performance each gameweek (real data only)
              </CardDescription>
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Real Data Only</AlertTitle>
                <AlertDescription>
                  This shows actual transfer counts and costs from your FPL history. Detailed player transfers require FPL login access.
                </AlertDescription>
              </Alert>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Gameweek</th>
                      <th className="text-center p-2">Transfers</th>
                      <th className="text-center p-2">Hit Cost</th>
                      <th className="text-center p-2">GW Points</th>
                      <th className="text-center p-2">GW Rank</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferSummary.map((gw) => (
                      <tr key={gw.gameweek} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">GW {gw.gameweek}</td>
                        <td className="p-2 text-center">
                          {gw.transferCount > 0 ? (
                            <Badge variant="outline">{gw.transferCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {gw.transferCost > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              -{gw.transferCost}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-medium">{gw.points}</td>
                        <td className="p-2 text-center text-sm">{formatNumber(gw.rank)}</td>
                        <td className="p-2 text-center">
                          {gw.transferCount === 0 ? (
                            <Badge variant="secondary">No transfers</Badge>
                          ) : gw.isHit ? (
                            <Badge className="bg-orange-500">Hit taken</Badge>
                          ) : (
                            <Badge className="bg-blue-500">Free transfer</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Transfer Strategy Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">When to Take Hits</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Player you're buying likely to score 6+ more points</li>
                    <li>• Before price rises you want to catch</li>
                    <li>• To avoid price drops on players you're selling</li>
                    <li>• For Double Gameweek players</li>
                    <li>• When your player is injured/suspended</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">When to Avoid Hits</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Just for differential picks</li>
                    <li>• Chasing last week's points</li>
                    <li>• Moving money around without clear plan</li>
                    <li>• Late in the gameweek without good reason</li>
                    <li>• When you have other pressing transfers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && transferSummary.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <RefreshCw className="h-8 w-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}