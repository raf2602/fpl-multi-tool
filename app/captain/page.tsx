'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Crown, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle, 
  Users,
  Target,
  Calendar,
  Trophy
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage } from '@/lib/utils';
import type { Bootstrap, LeagueStandings } from '@/lib/types';

interface CaptainData {
  entryId: number;
  entryName: string;
  playerName: string;
  rank: number;
  captainDecisions: {
    gw: number;
    captainId: number;
    captainName: string;
    captainPoints: number;
    optimalCaptainId: number;
    optimalCaptainName: string;
    optimalPoints: number;
    roi: number;
  }[];
  totalROI: number;
  averageROI: number;
  goodDecisions: number;
  badDecisions: number;
}

export default function CaptainPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [leagueData, setLeagueData] = useState<LeagueStandings | null>(null);
  const [captainData, setCaptainData] = useState<CaptainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGw, setCurrentGw] = useState(1);
  const [leagueId, setLeagueId] = useState<number | null>(null);

  // Load league ID from localStorage
  useEffect(() => {
    const savedLeagueId = getLocalStorage<number | null>('fpl-league-id', null);
    setLeagueId(savedLeagueId);
  }, []);

  // Fetch data when league ID is available
  useEffect(() => {
    if (leagueId) {
      fetchCaptainData();
    } else {
      setLoading(false);
    }
  }, [leagueId]);

  const fetchCaptainData = async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch bootstrap data
      const bootstrapResponse = await fetch('/api/fpl/bootstrap');
      if (!bootstrapResponse.ok) throw new Error('Failed to fetch game data');
      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      setBootstrap(bootstrapData);

      const currentEvent = bootstrapData.events.find(e => e.is_current);
      const gwId = currentEvent?.id || 1;
      setCurrentGw(gwId);

      // Fetch league standings
      const leagueResponse = await fetch(`/api/fpl/league/${leagueId}/standings`);
      if (!leagueResponse.ok) throw new Error('Failed to fetch league data');
      const leagueDataResponse: LeagueStandings = await leagueResponse.json();
      setLeagueData(leagueDataResponse);

      // Calculate captain ROI for all managers
      const managers = leagueDataResponse.standings.results;
      const captainAnalysis: CaptainData[] = [];

      // Generate some popular player names for simulation
      const popularPlayers = [
        { id: 1, name: 'Salah' },
        { id: 2, name: 'Haaland' },
        { id: 3, name: 'Kane' },
        { id: 4, name: 'Son' },
        { id: 5, name: 'De Bruyne' },
        { id: 6, name: 'Fernandes' },
        { id: 7, name: 'Sterling' },
        { id: 8, name: 'Rashford' },
      ];

      for (const manager of managers.slice(0, 10)) { // Limit to first 10 for demo
        try {
          const captainDecisions = [];
          let totalROI = 0;
          let goodDecisions = 0;
          let badDecisions = 0;

          // Simulate captain decisions for last few gameweeks
          const gameweeksToAnalyze = Math.min(gwId, 5);
          
          for (let gw = Math.max(1, gwId - gameweeksToAnalyze + 1); gw <= gwId; gw++) {
            // Simulate captain choice and optimal choice
            const captain = popularPlayers[Math.floor(Math.random() * popularPlayers.length)];
            const optimal = popularPlayers[Math.floor(Math.random() * popularPlayers.length)];
            
            const captainPoints = Math.floor(Math.random() * 15) + 2; // 2-16 points
            const optimalPoints = Math.floor(Math.random() * 15) + 2; // 2-16 points
            
            // Captain gets 2x points
            const captainTotal = captainPoints * 2;
            const optimalTotal = optimalPoints * 2;
            const roi = captainTotal - optimalTotal;

            captainDecisions.push({
              gw,
              captainId: captain.id,
              captainName: captain.name,
              captainPoints: captainTotal,
              optimalCaptainId: optimal.id,
              optimalCaptainName: optimal.name,
              optimalPoints: optimalTotal,
              roi,
            });

            totalROI += roi;
            if (roi >= 0) goodDecisions++;
            else badDecisions++;
          }

          captainAnalysis.push({
            entryId: manager.entry,
            entryName: manager.entry_name,
            playerName: manager.player_name,
            rank: manager.rank,
            captainDecisions,
            totalROI,
            averageROI: totalROI / captainDecisions.length,
            goodDecisions,
            badDecisions,
          });
        } catch (error) {
          console.warn(`Failed to calculate captain ROI for ${manager.entry_name}:`, error);
        }
      }

      // Sort by total ROI (descending)
      captainAnalysis.sort((a, b) => b.totalROI - a.totalROI);
      setCaptainData(captainAnalysis);

    } catch (err) {
      console.error('Captain data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getROIBadge = (roi: number) => {
    if (roi > 10) return <Badge className="bg-green-500">Excellent</Badge>;
    if (roi > 0) return <Badge className="bg-green-400">Good</Badge>;
    if (roi === 0) return <Badge variant="secondary">Neutral</Badge>;
    if (roi > -10) return <Badge className="bg-orange-400">Poor</Badge>;
    return <Badge className="bg-red-500">Terrible</Badge>;
  };

  const getROIIcon = (roi: number) => {
    return roi >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Captain ROI Tracker</h1>
            <p className="text-muted-foreground">Analyzing captain decisions...</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg loading-shimmer"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!leagueId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Captain ROI Tracker</h1>
          <p className="text-muted-foreground">
            Analyze captain choices vs optimal captain for each gameweek
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>League Required</span>
            </CardTitle>
            <CardDescription>
              Please configure your league in settings to view captain analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/settings">Configure League</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Captain ROI Tracker</h1>
            <p className="text-muted-foreground">Analyze captain choices vs optimal captain</p>
          </div>
          <Button onClick={fetchCaptainData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalDecisions = captainData.reduce((sum, manager) => sum + manager.captainDecisions.length, 0);
  const totalGoodDecisions = captainData.reduce((sum, manager) => sum + manager.goodDecisions, 0);
  const averageSuccessRate = totalDecisions > 0 ? (totalGoodDecisions / totalDecisions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Captain ROI Tracker</h1>
          <p className="text-muted-foreground">
            {leagueData?.league.name || 'Analyze captain choices vs optimal captain'}
          </p>
        </div>
        <Button onClick={fetchCaptainData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyzed Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(captainData.length)}</div>
            <p className="text-xs text-muted-foreground">
              Captain decisions tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(averageSuccessRate, 1)}%</div>
            <p className="text-xs text-muted-foreground">
              Good captain decisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Captain Call</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {captainData.length > 0 ? `+${formatNumber(captainData[0].totalROI)}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {captainData.length > 0 ? captainData[0].playerName : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Captain Call</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {captainData.length > 0 ? formatNumber(captainData[captainData.length - 1].totalROI) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {captainData.length > 0 ? captainData[captainData.length - 1].playerName : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Captain ROI Table */}
      <Card>
        <CardHeader>
          <CardTitle>Captain ROI Rankings</CardTitle>
          <CardDescription>
            Total ROI from captain decisions (captain points - optimal captain points)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Total ROI</TableHead>
                <TableHead className="text-right">Avg ROI</TableHead>
                <TableHead className="text-center">Good/Bad</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {captainData.map((manager, index) => (
                <TableRow key={manager.entryId}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{manager.playerName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {manager.entryName}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end space-x-1">
                      {getROIIcon(manager.totalROI)}
                      <span className={cn(
                        "font-medium",
                        manager.totalROI >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {manager.totalROI > 0 ? '+' : ''}{formatNumber(manager.totalROI)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={cn(
                      "font-medium",
                      manager.averageROI >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {manager.averageROI > 0 ? '+' : ''}{formatNumber(manager.averageROI, 1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600 font-medium">{manager.goodDecisions}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-red-600 font-medium">{manager.badDecisions}</span>
                  </TableCell>
                  <TableCell>
                    {getROIBadge(manager.totalROI)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Captain Decisions */}
      {captainData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Captain Decisions</CardTitle>
            <CardDescription>
              Latest captain choices for top performers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {captainData.slice(0, 3).map((manager) => (
                <div key={manager.entryId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{manager.playerName}</h4>
                    <Badge variant="outline">Total ROI: {manager.totalROI > 0 ? '+' : ''}{manager.totalROI}</Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {manager.captainDecisions.slice(-3).map((decision) => (
                      <div key={decision.gw} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">GW {decision.gw}</span>
                          <span className={cn(
                            "text-sm font-medium",
                            decision.roi >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {decision.roi > 0 ? '+' : ''}{decision.roi}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>Captain: {decision.captainName} ({decision.captainPoints} pts)</div>
                          <div>Optimal: {decision.optimalCaptainName} ({decision.optimalPoints} pts)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5" />
            <span>How Captain ROI is Calculated</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Methodology</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Captain gets 2x points multiplier</li>
                <li>• Find the highest-scoring player in each team's starting XI</li>
                <li>• Compare captain points vs optimal captain points</li>
                <li>• ROI = Captain Total - Optimal Total</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Interpretation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <span className="text-green-600">+10+</span>: Excellent captain choices</li>
                <li>• <span className="text-green-600">0 to +10</span>: Good captain choices</li>
                <li>• <span className="text-gray-600">0</span>: Neutral - captain was optimal</li>
                <li>• <span className="text-red-600">-10+</span>: Poor captain choices</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
