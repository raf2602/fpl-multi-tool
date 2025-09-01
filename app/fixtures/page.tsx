'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  Calendar, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Sword,
  Clock
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { Bootstrap, Fixture } from '@/lib/types';

interface TeamFixtureRun {
  teamId: number;
  teamName: string;
  shortName: string;
  fixtures: {
    gw: number;
    opponent: string;
    opponentShort: string;
    difficulty: number;
    isHome: boolean;
    kickoffTime: string | null;
  }[];
  averageDifficulty: number;
  fixtureCount: number;
  homeCount: number;
  awayCount: number;
  blankGameweeks: number[];
  doubleGameweeks: number[];
}

export default function FixturesPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixtureRuns, setFixtureRuns] = useState<TeamFixtureRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGw, setCurrentGw] = useState(1);
  const [gameweeksAhead, setGameweeksAhead] = useState(5);

  useEffect(() => {
    fetchFixtureData();
  }, [gameweeksAhead]);

  const fetchFixtureData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bootstrap and fixtures data (with cache busting)
      const [bootstrapResponse, fixturesResponse] = await Promise.all([
        fetch(`/api/fpl/bootstrap?t=${Date.now()}`),
        fetch('/api/fpl/fixtures')
      ]);

      if (!bootstrapResponse.ok) throw new Error('Failed to fetch game data');
      if (!fixturesResponse.ok) throw new Error('Failed to fetch fixtures data');

      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      const fixturesData: Fixture[] = await fixturesResponse.json();

      setBootstrap(bootstrapData);
      setFixtures(fixturesData);

      const currentEvent = bootstrapData.events.find(e => e.is_current);
      const gwId = currentEvent?.id || 1;
      setCurrentGw(gwId);

      // Calculate fixture runs for each team
      const runs = calculateFixtureRuns(bootstrapData, fixturesData, gwId, gameweeksAhead);
      setFixtureRuns(runs);

    } catch (err) {
      console.error('Fixture data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateFixtureRuns = (
    bootstrap: Bootstrap,
    fixtures: Fixture[],
    currentGw: number,
    ahead: number
  ): TeamFixtureRun[] => {
    const relevantFixtures = fixtures.filter(
      fixture => fixture.event && 
      fixture.event > currentGw && 
      fixture.event <= currentGw + ahead &&
      !fixture.finished
    );

    return bootstrap.teams.map(team => {
      const teamFixtures = relevantFixtures
        .filter(fixture => fixture.team_h === team.id || fixture.team_a === team.id)
        .map(fixture => {
          const isHome = fixture.team_h === team.id;
          const opponentId = isHome ? fixture.team_a : fixture.team_h;
          const opponent = bootstrap.teams.find(t => t.id === opponentId);
          const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;

          return {
            gw: fixture.event!,
            opponent: opponent?.name || 'Unknown',
            opponentShort: opponent?.short_name || 'UNK',
            difficulty,
            isHome,
            kickoffTime: fixture.kickoff_time,
          };
        })
        .sort((a, b) => a.gw - b.gw);

      // Calculate average difficulty
      const averageDifficulty = teamFixtures.length > 0 
        ? teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamFixtures.length
        : 0;

      // Count home/away fixtures
      const homeCount = teamFixtures.filter(f => f.isHome).length;
      const awayCount = teamFixtures.filter(f => !f.isHome).length;

      // Find blank and double gameweeks
      const gameweekCounts = new Map<number, number>();
      teamFixtures.forEach(fixture => {
        gameweekCounts.set(fixture.gw, (gameweekCounts.get(fixture.gw) || 0) + 1);
      });

      const blankGameweeks: number[] = [];
      const doubleGameweeks: number[] = [];

      for (let gw = currentGw + 1; gw <= currentGw + ahead; gw++) {
        const count = gameweekCounts.get(gw) || 0;
        if (count === 0) blankGameweeks.push(gw);
        if (count > 1) doubleGameweeks.push(gw);
      }

      return {
        teamId: team.id,
        teamName: team.name,
        shortName: team.short_name,
        fixtures: teamFixtures,
        averageDifficulty,
        fixtureCount: teamFixtures.length,
        homeCount,
        awayCount,
        blankGameweeks,
        doubleGameweeks,
      };
    }).sort((a, b) => a.averageDifficulty - b.averageDifficulty);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-500 text-white';
    if (difficulty === 3) return 'bg-yellow-500 text-black';
    if (difficulty === 4) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getDifficultyBadge = (averageDifficulty: number) => {
    if (averageDifficulty <= 2.5) return <Badge className="bg-green-500">Excellent</Badge>;
    if (averageDifficulty <= 3) return <Badge className="bg-green-400">Good</Badge>;
    if (averageDifficulty <= 3.5) return <Badge variant="secondary">Average</Badge>;
    if (averageDifficulty <= 4) return <Badge className="bg-orange-400">Difficult</Badge>;
    return <Badge className="bg-red-500">Very Difficult</Badge>;
  };

  const getFixtureIcon = (averageDifficulty: number) => {
    if (averageDifficulty <= 3) return <TrendingDown className="h-4 w-4 text-green-600" />;
    if (averageDifficulty <= 3.5) return <Minus className="h-4 w-4 text-gray-600" />;
    return <TrendingUp className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fixture Run Planner</h1>
            <p className="text-muted-foreground">Analyzing fixture difficulty...</p>
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fixture Run Planner</h1>
            <p className="text-muted-foreground">Squad fixture difficulty analysis</p>
          </div>
          <Button onClick={fetchFixtureData} variant="outline" size="sm">
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
          <h1 className="text-3xl font-bold tracking-tight">Fixture Run Planner</h1>
          <p className="text-muted-foreground">
            Squad fixture difficulty and blanks/doubles analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={gameweeksAhead}
            onChange={(e) => setGameweeksAhead(parseInt(e.target.value))}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={3}>Next 3 GWs</option>
            <option value={5}>Next 5 GWs</option>
            <option value={8}>Next 8 GWs</option>
            <option value={10}>Next 10 GWs</option>
          </select>
          <Button onClick={fetchFixtureData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Analyzed</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(fixtureRuns.length)}</div>
            <p className="text-xs text-muted-foreground">
              Premier League teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gameweeks Ahead</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameweeksAhead}</div>
            <p className="text-xs text-muted-foreground">
              GW {currentGw + 1} to {currentGw + gameweeksAhead}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Easiest Fixtures</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fixtureRuns.length > 0 ? fixtureRuns[0].shortName : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {fixtureRuns.length > 0 ? formatNumber(fixtureRuns[0].averageDifficulty, 1) + ' avg' : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hardest Fixtures</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fixtureRuns.length > 0 ? fixtureRuns[fixtureRuns.length - 1].shortName : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {fixtureRuns.length > 0 ? formatNumber(fixtureRuns[fixtureRuns.length - 1].averageDifficulty, 1) + ' avg' : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fixture Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Fixture Difficulty Grid</CardTitle>
          <CardDescription>
            Next {gameweeksAhead} gameweeks fixture difficulty for all teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b font-medium">Team</th>
                  <th className="text-center p-2 border-b font-medium">Avg</th>
                  {Array.from({ length: gameweeksAhead }, (_, i) => (
                    <th key={i} className="text-center p-2 border-b font-medium">
                      GW{currentGw + i + 1}
                    </th>
                  ))}
                  <th className="text-center p-2 border-b font-medium">H/A</th>
                  <th className="text-center p-2 border-b font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {fixtureRuns.map((team) => (
                  <tr key={team.teamId} className="hover:bg-muted/50">
                    <td className="p-2 font-medium">{team.shortName}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {getFixtureIcon(team.averageDifficulty)}
                        <span className="font-mono">
                          {formatNumber(team.averageDifficulty, 1)}
                        </span>
                      </div>
                    </td>
                    {Array.from({ length: gameweeksAhead }, (_, i) => {
                      const gw = currentGw + i + 1;
                      const fixture = team.fixtures.find(f => f.gw === gw);
                      
                      return (
                        <td key={i} className="p-1 text-center">
                          {fixture ? (
                            <div className="space-y-1">
                              <div className={cn(
                                "text-xs px-2 py-1 rounded font-medium",
                                getDifficultyColor(fixture.difficulty)
                              )}>
                                {fixture.opponentShort}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {fixture.isHome ? 'H' : 'A'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">-</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center text-sm">
                      <span className="text-green-600">{team.homeCount}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-blue-600">{team.awayCount}</span>
                    </td>
                    <td className="p-2 text-center">
                      {team.doubleGameweeks.length > 0 ? (
                        <Badge className="bg-green-500 text-xs">DGW</Badge>
                      ) : team.blankGameweeks.length > 0 ? (
                        <Badge className="bg-red-500 text-xs">BGW</Badge>
                      ) : (
                        getDifficultyBadge(team.averageDifficulty)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sword className="h-5 w-5" />
            <span>Difficulty Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Fixture Difficulty Scale</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white font-bold text-xs">1</div>
                  <span>Very Easy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-green-400 flex items-center justify-center text-white font-bold text-xs">2</div>
                  <span>Easy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center text-black font-bold text-xs">3</div>
                  <span>Average</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-xs">4</div>
                  <span>Difficult</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-white font-bold text-xs">5</div>
                  <span>Very Difficult</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Key</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>H/A</strong>: Home fixtures / Away fixtures</li>
                <li>• <strong>DGW</strong>: Double Gameweek</li>
                <li>• <strong>BGW</strong>: Blank Gameweek</li>
                <li>• <strong>Avg</strong>: Average fixture difficulty</li>
                <li>• Lower difficulty = easier fixtures</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
