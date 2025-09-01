'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Activity, Users, Calendar, TrendingUp, Crown, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { cn, formatNumber, getLocalStorage, setLocalStorage, formatLeagueType, formatScoring } from '@/lib/utils';
import type { Bootstrap, LeagueStandings } from '@/lib/types';

interface DashboardStats {
  totalManagers: number;
  averageScore: number;
  topScore: number;
  currentGw: number;
  isLive: boolean;
}

export default function Dashboard() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [leagueData, setLeagueData] = useState<LeagueStandings | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState<number | null>(null);

  // Load league ID from localStorage on mount
  useEffect(() => {
    const savedLeagueId = getLocalStorage<number | null>('fpl-league-id', null);
    setLeagueId(savedLeagueId);
  }, []);

  // Fetch data when league ID is available
  useEffect(() => {
    if (leagueId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [leagueId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bootstrap data (with cache busting)
      const bootstrapResponse = await fetch(`/api/fpl/bootstrap?t=${Date.now()}`);
      if (!bootstrapResponse.ok) {
        throw new Error('Failed to fetch game data');
      }
      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      setBootstrap(bootstrapData);

      // Fetch league data if league ID is set
      if (leagueId) {
        const leagueResponse = await fetch(`/api/fpl/league/${leagueId}/standings`);
        if (!leagueResponse.ok) {
          throw new Error('Failed to fetch league data');
        }
        const leagueDataResponse: LeagueStandings = await leagueResponse.json();
        setLeagueData(leagueDataResponse);

        // Calculate stats
        const currentEvent = bootstrapData.events.find(e => e.is_current);
        const standings = leagueDataResponse.standings.results;
        
        const dashboardStats: DashboardStats = {
          totalManagers: standings.length,
          averageScore: Math.round(
            standings.reduce((sum, entry) => sum + entry.total, 0) / standings.length
          ),
          topScore: Math.max(...standings.map(entry => entry.total)),
          currentGw: currentEvent?.id || 1,
          isLive: currentEvent?.data_checked === false || false,
        };
        
        setStats(dashboardStats);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSetLeague = () => {
    // This would open a modal or navigate to settings
    // For now, we'll just navigate to settings
    window.location.href = '/settings';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">League overview and current status</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="loading-shimmer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="h-3 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!leagueId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to FPL Multi-Tool</h1>
          <p className="text-muted-foreground">
            Get started by setting up your classic league to unlock all analysis tools
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Get Started</span>
            </CardTitle>
            <CardDescription>
              Configure your FPL classic league to access live leaderboards, 
              luck analysis, captain tracking, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">What you'll get:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Live league leaderboard</li>
                  <li>• Luck vs median analysis</li>
                  <li>• Captain ROI tracking</li>
                  <li>• Transfer impact analysis</li>
                  <li>• Effective ownership insights</li>
                  <li>• And much more...</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Getting your League ID:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Go to your FPL league page</li>
                  <li>2. Copy the number from the URL</li>
                  <li>3. Example: /leagues/12345/standings</li>
                  <li>4. Your League ID is: 12345</li>
                </ol>
              </div>
            </div>
            <Button onClick={handleSetLeague} className="w-full sm:w-auto">
              Set Up League
            </Button>
          </CardContent>
        </Card>

        {bootstrap && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Gameweek</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  GW {bootstrap.events.find(e => e.is_current)?.id || 1}
                </div>
                <p className="text-xs text-muted-foreground">
                  {bootstrap.events.find(e => e.is_current)?.name || 'Current gameweek'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(bootstrap.total_players)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Playing this season
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Tools</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">10</div>
                <p className="text-xs text-muted-foreground">
                  Analysis tools available
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">League overview and current status</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {leagueData?.league.name || 'League overview and current status'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {stats?.isLive && (
            <Badge variant="destructive" className="animate-pulse">
              <Activity className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalManagers)}</div>
              <p className="text-xs text-muted-foreground">
                Active in league
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.averageScore)}</div>
              <p className="text-xs text-muted-foreground">
                League average total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Score</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.topScore)}</div>
              <p className="text-xs text-muted-foreground">
                Highest in league
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current GW</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GW {stats.currentGw}</div>
              <p className="text-xs text-muted-foreground">
                {stats.isLive ? 'In progress' : 'Completed'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {leagueData && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>League Information</CardTitle>
              <CardDescription>
                Details about your selected league
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">League Name</p>
                  <p className="text-lg">{leagueData.league.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">League ID</p>
                  <p className="text-lg font-mono">{leagueData.league.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">League Type</p>
                  <p className="text-lg">{formatLeagueType(leagueData.league.league_type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scoring</p>
                  <p className="text-lg">{formatScoring(leagueData.league.scoring)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump to the most popular analysis tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start" variant="outline">
                <a href="/live">
                  <Activity className="h-4 w-4 mr-2" />
                  View Live Leaderboard
                </a>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <a href="/luck">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Check Luck Analysis
                </a>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <a href="/captain">
                  <Crown className="h-4 w-4 mr-2" />
                  Captain ROI Tracker
                </a>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <a href="/eo">
                  <Users className="h-4 w-4 mr-2" />
                  Effective Ownership
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
