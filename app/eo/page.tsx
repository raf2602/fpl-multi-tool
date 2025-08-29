'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Crown,
  Star,
  Percent,
  Target,
  Trophy
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage, setLocalStorage } from '@/lib/utils';
import type { Bootstrap, LeagueStandings } from '@/lib/types';

interface PlayerEO {
  playerId: number;
  playerName: string;
  position: string;
  team: string;
  ownership: number;
  captaincy: number;
  effectiveOwnership: number;
  eoRank: number;
  template: boolean;
  differential: boolean;
  price: number;
  totalPoints: number;
  form: number;
}

export default function EOPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [leagueId, setLeagueId] = useState<string>('');
  const [playerEO, setPlayerEO] = useState<PlayerEO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [templateThreshold, setTemplateThreshold] = useState(50);
  const [differentialThreshold, setDifferentialThreshold] = useState(10);

  useEffect(() => {
    const savedLeagueId = getLocalStorage('leagueId');
    if (savedLeagueId) {
      setLeagueId(savedLeagueId);
    }
  }, []);

  const handleSubmit = async () => {
    if (!leagueId.trim()) {
      setError('Please enter a valid league ID');
      return;
    }

    setLocalStorage('leagueId', leagueId);
    await fetchEOData();
  };

  const fetchEOData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!leagueId) {
        throw new Error('League ID is required');
      }

      // Fetch bootstrap data and league standings
      const [bootstrapResponse, leagueResponse] = await Promise.all([
        fetch('/api/fpl/bootstrap'),
        fetch(`/api/fpl/league/${leagueId}/standings`)
      ]);

      if (!bootstrapResponse.ok) throw new Error('Failed to fetch game data');
      if (!leagueResponse.ok) throw new Error('Failed to fetch league data');

      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      const leagueData: LeagueStandings = await leagueResponse.json();

      setBootstrap(bootstrapData);

      // Calculate effective ownership for all players
      const eoData = calculateEffectiveOwnership(bootstrapData, leagueData);
      setPlayerEO(eoData);

    } catch (err) {
      console.error('EO data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateEffectiveOwnership = (bootstrap: Bootstrap, league: LeagueStandings): PlayerEO[] => {
    // For demonstration, generate simulated EO data
    // In a real implementation, you'd fetch individual team data for each league member
    
    const playerData = bootstrap.elements.map((player) => {
      const position = bootstrap.element_types.find(pos => pos.id === player.element_type)?.singular_name || 'Player';
      const team = bootstrap.teams.find(t => t.id === player.team)?.short_name || 'UNK';
      
      // Simulate ownership and captaincy percentages
      const baseOwnership = Math.random() * 80; // 0-80% ownership
      const captaincy = Math.random() * 30; // 0-30% captaincy
      
      // Calculate effective ownership (ownership + captaincy)
      const effectiveOwnership = baseOwnership + captaincy;
      
      // Determine if template or differential
      const template = effectiveOwnership >= templateThreshold;
      const differential = effectiveOwnership <= differentialThreshold;
      
      return {
        playerId: player.id,
        playerName: player.web_name,
        position,
        team,
        ownership: baseOwnership,
        captaincy,
        effectiveOwnership,
        eoRank: 0, // Will be set after sorting
        template,
        differential,
        price: player.now_cost / 10,
        totalPoints: player.total_points,
        form: parseFloat(player.form),
      };
    });

    // Sort by effective ownership and assign ranks
    const sortedData = playerData.sort((a, b) => b.effectiveOwnership - a.effectiveOwnership);
    return sortedData.map((player, index) => ({
      ...player,
      eoRank: index + 1,
    }));
  };

  const filteredPlayers = playerEO.filter(player => {
    if (selectedPosition === 'all') return true;
    return player.position.toLowerCase() === selectedPosition.toLowerCase();
  });

  const templatePlayers = filteredPlayers.filter(p => p.template);
  const differentialPlayers = filteredPlayers.filter(p => p.differential);
  const topEOPlayers = filteredPlayers.slice(0, 20);

  const getEOColor = (eo: number) => {
    if (eo >= templateThreshold) return 'text-red-600';
    if (eo <= differentialThreshold) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getEOBadge = (player: PlayerEO) => {
    if (player.template) return <Badge className="bg-red-500">Template</Badge>;
    if (player.differential) return <Badge className="bg-green-500">Differential</Badge>;
    return <Badge variant="secondary">Balanced</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Effective Ownership</h1>
        <p className="text-muted-foreground">
          Weighted ownership analysis for players and captains
        </p>
      </div>

      {/* League ID Input */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Your League ID</CardTitle>
          <CardDescription>
            Your league ID can be found in the URL of your league page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="e.g., 123456"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !leagueId.trim()}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
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

      {playerEO.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Template Players</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatNumber(templatePlayers.length)}</div>
                <p className="text-xs text-muted-foreground">
                  ≥{templateThreshold}% effective ownership
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Differential Players</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatNumber(differentialPlayers.length)}</div>
                <p className="text-xs text-muted-foreground">
                  ≤{differentialThreshold}% effective ownership
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest EO</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {topEOPlayers.length > 0 ? topEOPlayers[0].playerName : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {topEOPlayers.length > 0 ? formatNumber(topEOPlayers[0].effectiveOwnership, 1) + '%' : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average EO</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(filteredPlayers.reduce((sum, p) => sum + p.effectiveOwnership, 0) / filteredPlayers.length, 1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all players
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Position Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filter by Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                {['all', 'goalkeeper', 'defender', 'midfielder', 'forward'].map((pos) => (
                  <Button
                    key={pos}
                    variant={selectedPosition === pos ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPosition(pos)}
                  >
                    {pos === 'all' ? 'All' : pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Effective Ownership Analysis */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Players</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="differential">Differentials</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Effective Ownership Rankings</CardTitle>
                  <CardDescription>
                    Top players by effective ownership (ownership + captaincy)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Rank</th>
                          <th className="text-left p-2">Player</th>
                          <th className="text-left p-2">Team</th>
                          <th className="text-left p-2">Position</th>
                          <th className="text-right p-2">Ownership</th>
                          <th className="text-right p-2">Captaincy</th>
                          <th className="text-right p-2">Effective</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-center p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topEOPlayers.map((player) => (
                          <tr key={player.playerId} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{player.eoRank}</td>
                            <td className="p-2">
                              <div className="font-medium">{player.playerName}</div>
                              <div className="text-xs text-muted-foreground">
                                {player.totalPoints} pts • {player.form} form
                              </div>
                            </td>
                            <td className="p-2">{player.team}</td>
                            <td className="p-2">{player.position}</td>
                            <td className="p-2 text-right">{formatNumber(player.ownership, 1)}%</td>
                            <td className="p-2 text-right">{formatNumber(player.captaincy, 1)}%</td>
                            <td className={cn("p-2 text-right font-semibold", getEOColor(player.effectiveOwnership))}>
                              {formatNumber(player.effectiveOwnership, 1)}%
                            </td>
                            <td className="p-2 text-right">£{formatNumber(player.price, 1)}m</td>
                            <td className="p-2 text-center">{getEOBadge(player)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Players</CardTitle>
                  <CardDescription>
                    Players with high effective ownership (≥{templateThreshold}%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {templatePlayers.slice(0, 15).map((player) => (
                      <div key={player.playerId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-red-50">
                            <Trophy className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{player.playerName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {player.position} • {player.team} • £{formatNumber(player.price, 1)}m
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            {formatNumber(player.effectiveOwnership, 1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(player.ownership, 1)}% + {formatNumber(player.captaincy, 1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="differential" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Differential Players</CardTitle>
                  <CardDescription>
                    Players with low effective ownership (≤{differentialThreshold}%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {differentialPlayers
                      .filter(p => p.totalPoints >= 30) // Filter for reasonable point scorers
                      .slice(0, 15)
                      .map((player) => (
                      <div key={player.playerId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-green-50">
                            <Star className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{player.playerName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {player.position} • {player.team} • £{formatNumber(player.price, 1)}m
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatNumber(player.effectiveOwnership, 1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {player.totalPoints} pts • {player.form} form
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* EO Strategy Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Effective Ownership Strategy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Template Players (High EO)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Essential for avoiding rank drops</li>
                    <li>• Low risk, low reward picks</li>
                    <li>• Must-have if blanking will hurt badly</li>
                    <li>• Consider for core team positions</li>
                    <li>• Captain choices with high upside</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Differential Players (Low EO)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• High risk, high reward picks</li>
                    <li>• Great for climbing ranks quickly</li>
                    <li>• Consider form and fixtures carefully</li>
                    <li>• Don't go too differential in defense</li>
                    <li>• Perfect for captain punts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && playerEO.length === 0 && (
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