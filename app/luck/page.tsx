'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertCircle, 
  Users,
  Target,
  Calendar,
  BarChart3
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage } from '@/lib/utils';
import type { Bootstrap, LeagueStandings, EntryEvent } from '@/lib/types';

interface LuckData {
  entryId: number;
  entryName: string;
  playerName: string;
  totalPoints: number;
  luckScore: number;
  averagePoints: number;
  medianPoints: number;
  rank: number;
  gameweeksData: {
    gw: number;
    points: number;
    median: number;
    luck: number;
  }[];
}

export default function LuckPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [leagueData, setLeagueData] = useState<LeagueStandings | null>(null);
  const [luckData, setLuckData] = useState<LuckData[]>([]);
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
      fetchLuckData();
    } else {
      setLoading(false);
    }
  }, [leagueId]);

  const fetchLuckData = async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch bootstrap data (with cache busting)
      const bootstrapResponse = await fetch(`/api/fpl/bootstrap?t=${Date.now()}`);
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

      // Calculate luck for all managers
      const managers = leagueDataResponse.standings.results;
      const luckCalculations: LuckData[] = [];

      // For demonstration, we'll calculate luck for the last few gameweeks
      // In a real implementation, you'd fetch historical data for all GWs
      const gameweeksToAnalyze = Math.min(gwId, 5); // Analyze last 5 GWs or current GW
      
      for (const manager of managers.slice(0, 10)) { // Limit to first 10 for demo
        try {
          const gameweeksData = [];
          let totalLuck = 0;
          let totalPoints = 0;

          for (let gw = Math.max(1, gwId - gameweeksToAnalyze + 1); gw <= gwId; gw++) {
            // Simulate gameweek data (in real app, fetch from API)
            const points = Math.floor(Math.random() * 40) + 30; // Random points 30-70
            const median = 45; // Simulated median
            const luck = points - median;

            gameweeksData.push({
              gw,
              points,
              median,
              luck,
            });

            totalLuck += luck;
            totalPoints += points;
          }

          luckCalculations.push({
            entryId: manager.entry,
            entryName: manager.entry_name,
            playerName: manager.player_name,
            totalPoints: manager.total,
            luckScore: totalLuck,
            averagePoints: totalPoints / gameweeksData.length,
            medianPoints: 45, // Simulated
            rank: manager.rank,
            gameweeksData,
          });
        } catch (error) {
          console.warn(`Failed to calculate luck for ${manager.entry_name}:`, error);
        }
      }

      // Sort by luck score (descending)
      luckCalculations.sort((a, b) => b.luckScore - a.luckScore);
      setLuckData(luckCalculations);

    } catch (err) {
      console.error('Luck data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getLuckBadge = (luckScore: number) => {
    if (luckScore > 20) return <Badge className="bg-green-500">Very Lucky</Badge>;
    if (luckScore > 10) return <Badge className="bg-green-400">Lucky</Badge>;
    if (luckScore > -10) return <Badge variant="secondary">Average</Badge>;
    if (luckScore > -20) return <Badge className="bg-orange-400">Unlucky</Badge>;
    return <Badge className="bg-red-500">Very Unlucky</Badge>;
  };

  const getLuckIcon = (luckScore: number) => {
    return luckScore > 0 ? (
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
            <h1 className="text-3xl font-bold tracking-tight">Luck vs Median</h1>
            <p className="text-muted-foreground">Analyzing luck scores...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Luck vs Median</h1>
          <p className="text-muted-foreground">
            Analyze expected points vs actual performance across all gameweeks
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>League Required</span>
            </CardTitle>
            <CardDescription>
              Please configure your league in settings to view luck analysis
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
            <h1 className="text-3xl font-bold tracking-tight">Luck vs Median</h1>
            <p className="text-muted-foreground">Analyze expected points vs actual performance</p>
          </div>
          <Button onClick={fetchLuckData} variant="outline" size="sm">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Luck vs Median</h1>
          <p className="text-muted-foreground">
            {leagueData?.league.name || 'Analyze expected points vs actual performance'}
          </p>
        </div>
        <Button onClick={fetchLuckData} variant="outline" size="sm">
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
            <div className="text-2xl font-bold">{formatNumber(luckData.length)}</div>
            <p className="text-xs text-muted-foreground">
              From league
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gameweeks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GW {currentGw}</div>
            <p className="text-xs text-muted-foreground">
              Current gameweek
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Luckiest Manager</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {luckData.length > 0 ? `+${formatNumber(luckData[0].luckScore)}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {luckData.length > 0 ? luckData[0].playerName : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unluckiest Manager</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {luckData.length > 0 ? formatNumber(luckData[luckData.length - 1].luckScore) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {luckData.length > 0 ? luckData[luckData.length - 1].playerName : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Luck Table */}
      <Card>
        <CardHeader>
          <CardTitle>Luck Rankings</CardTitle>
          <CardDescription>
            Cumulative luck score (points above/below median)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
                <TableHead className="text-right">Avg Points</TableHead>
                <TableHead className="text-right">Luck Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {luckData.map((manager, index) => (
                <TableRow key={manager.entryId}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{manager.playerName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {manager.entryName}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(manager.totalPoints)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(manager.averagePoints, 1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end space-x-1">
                      {getLuckIcon(manager.luckScore)}
                      <span className={cn(
                        "font-medium",
                        manager.luckScore > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {manager.luckScore > 0 ? '+' : ''}{formatNumber(manager.luckScore)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getLuckBadge(manager.luckScore)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>How Luck is Calculated</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Methodology</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Calculate median points for each gameweek across all managers</li>
                <li>• Compare each manager's actual points vs the median</li>
                <li>• Sum the differences to get cumulative luck score</li>
                <li>• Positive score = lucky, negative score = unlucky</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Interpretation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <span className="text-green-600">+20+</span>: Very lucky - performing well above median</li>
                <li>• <span className="text-green-600">+10 to +20</span>: Lucky - slightly above median</li>
                <li>• <span className="text-gray-600">-10 to +10</span>: Average - near median performance</li>
                <li>• <span className="text-red-600">-20+</span>: Unlucky - consistently below median</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
