'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Activity, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Crown,
  Users,
  Calendar
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage } from '@/lib/utils';
import type { Bootstrap, LeagueStandings, LiveGw } from '@/lib/types';

interface LiveEntry {
  entry: number;
  player_name: string;
  entry_name: string;
  rank: number;
  last_rank: number;
  total: number;
  event_total: number;
  rank_change: number;
  is_captain?: boolean;
  captain_multiplier?: number;
}

export default function LivePage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [leagueData, setLeagueData] = useState<LeagueStandings | null>(null);
  const [liveData, setLiveData] = useState<LiveGw | null>(null);
  const [liveEntries, setLiveEntries] = useState<LiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
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
      fetchLiveData();
    } else {
      setLoading(false);
    }
  }, [leagueId]);

  // Auto refresh logic
  useEffect(() => {
    if (!autoRefresh || !leagueId) return;

    const interval = setInterval(() => {
      fetchLiveData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh, leagueId]);

  const fetchLiveData = useCallback(async () => {
    if (!leagueId) return;

    try {
      setError(null);
      
      // Fetch bootstrap data first to get current GW
      const bootstrapResponse = await fetch('/api/fpl/bootstrap');
      if (!bootstrapResponse.ok) throw new Error('Failed to fetch game data');
      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      setBootstrap(bootstrapData);
      
      const currentEvent = bootstrapData.events.find(e => e.is_current);
      const gwId = currentEvent?.id || 1;
      setCurrentGw(gwId);

      // Fetch league standings and live data in parallel
      const [leagueResponse, liveResponse] = await Promise.all([
        fetch(`/api/fpl/league/${leagueId}/standings`),
        fetch(`/api/fpl/live/${gwId}`)
      ]);

      if (!leagueResponse.ok) throw new Error('Failed to fetch league data');
      if (!liveResponse.ok) throw new Error('Failed to fetch live data');

      const [leagueDataResponse, liveDataResponse] = await Promise.all([
        leagueResponse.json() as Promise<LeagueStandings>,
        liveResponse.json() as Promise<LiveGw>
      ]);

      setLeagueData(leagueDataResponse);
      setLiveData(liveDataResponse);

      // Process live entries
      const entries: LiveEntry[] = leagueDataResponse.standings.results.map(entry => {
        const rankChange = entry.last_rank - entry.rank;
        
        return {
          entry: entry.entry,
          player_name: entry.player_name,
          entry_name: entry.entry_name,
          rank: entry.rank,
          last_rank: entry.last_rank,
          total: entry.total,
          event_total: entry.event_total,
          rank_change: rankChange,
        };
      });

      setLiveEntries(entries);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Live data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getRankChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live Leaderboard</h1>
            <p className="text-muted-foreground">Real-time league standings</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Live Leaderboard</h1>
          <p className="text-muted-foreground">Real-time league standings</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>League Required</span>
            </CardTitle>
            <CardDescription>
              Please configure your league in settings to view the live leaderboard
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
            <h1 className="text-3xl font-bold tracking-tight">Live Leaderboard</h1>
            <p className="text-muted-foreground">Real-time league standings</p>
          </div>
          <Button onClick={fetchLiveData} variant="outline" size="sm">
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

  const isLive = bootstrap?.events.find(e => e.is_current)?.data_checked === false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Leaderboard</h1>
          <p className="text-muted-foreground">
            {leagueData?.league.name || 'Real-time league standings'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            Auto Refresh
          </Button>
          <Button onClick={fetchLiveData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current GW</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GW {currentGw}</div>
            <p className="text-xs text-muted-foreground">
              {isLive ? 'In progress' : 'Completed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(liveEntries.length)}</div>
            <p className="text-xs text-muted-foreground">
              In league
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average GW Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveEntries.length > 0 
                ? Math.round(liveEntries.reduce((sum, entry) => sum + entry.event_total, 0) / liveEntries.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              This gameweek
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top GW Score</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveEntries.length > 0 
                ? Math.max(...liveEntries.map(entry => entry.event_total))
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Best this GW
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>League Standings</CardTitle>
              <CardDescription>
                Current positions and gameweek performance
              </CardDescription>
            </div>
            {lastUpdate && (
              <div className="text-xs text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">GW{currentGw}</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center w-[80px]">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liveEntries.map((entry, index) => (
                <TableRow key={entry.entry} className={cn(
                  index === 0 && "bg-yellow-50 dark:bg-yellow-950/10",
                  index < 3 && "font-medium"
                )}>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      <span>{entry.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.player_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.entry_name}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(entry.event_total)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(entry.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {getRankChangeIcon(entry.rank_change)}
                      <span className={cn("text-sm font-medium", getRankChangeColor(entry.rank_change))}>
                        {entry.rank_change === 0 ? '=' : Math.abs(entry.rank_change)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
