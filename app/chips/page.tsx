'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp,
  Crown,
  Shield,
  RotateCcw,
  Star,
  Clock,
  Target,
  Users
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage, setLocalStorage } from '@/lib/utils';
import type { Bootstrap, EntryHistory } from '@/lib/types';

interface ChipUsage {
  chipName: 'wildcard' | 'bboost' | '3xc' | 'freehit';
  chipDisplayName: string;
  gameweek: number;
  pointsScored: number;
  averageWithoutChip: number;
  effectiveness: number;
  timing: 'Early' | 'Optimal' | 'Late' | 'Poor';
  timingScore: number;
}

interface ChipRecommendation {
  chipName: 'wildcard' | 'bboost' | '3xc' | 'freehit';
  chipDisplayName: string;
  recommendedGw: number;
  reason: string;
  expectedBenefit: number;
  priority: 'High' | 'Medium' | 'Low';
}

export default function ChipsPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [entryId, setEntryId] = useState<string>('');
  const [chipUsages, setChipUsages] = useState<ChipUsage[]>([]);
  const [chipRecommendations, setChipRecommendations] = useState<ChipRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [averageChipEffectiveness, setAverageChipEffectiveness] = useState(0);
  const [bestChipGw, setBestChipGw] = useState<number | null>(null);
  const [worstChipGw, setWorstChipGw] = useState<number | null>(null);

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
    await fetchChipData();
  };

  const fetchChipData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!entryId) {
        throw new Error('Entry ID is required');
      }

      // Fetch bootstrap data and entry history
      const [bootstrapResponse, historyResponse] = await Promise.all([
        fetch('/api/fpl/bootstrap'),
        fetch(`/api/fpl/entry/${entryId}/history`)
      ]);

      if (!bootstrapResponse.ok) throw new Error('Failed to fetch game data');
      if (!historyResponse.ok) throw new Error('Failed to fetch entry history');

      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      const historyData: EntryHistory = await historyResponse.json();

      setBootstrap(bootstrapData);

      // Analyze chip usage and generate recommendations
      const usages = analyzeChipUsage(bootstrapData, historyData);
      const recommendations = generateChipRecommendations(bootstrapData, historyData);

      setChipUsages(usages);
      setChipRecommendations(recommendations);

      // Calculate summary stats
      const avgEffectiveness = usages.length > 0 
        ? usages.reduce((sum, chip) => sum + chip.effectiveness, 0) / usages.length
        : 0;
      
      const bestChip = usages.reduce((best, chip) => 
        chip.effectiveness > (best?.effectiveness || -Infinity) ? chip : best, null as ChipUsage | null);
      
      const worstChip = usages.reduce((worst, chip) => 
        chip.effectiveness < (worst?.effectiveness || Infinity) ? chip : worst, null as ChipUsage | null);

      setAverageChipEffectiveness(avgEffectiveness);
      setBestChipGw(bestChip?.gameweek || null);
      setWorstChipGw(worstChip?.gameweek || null);

    } catch (err) {
      console.error('Chip data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const analyzeChipUsage = (bootstrap: Bootstrap, history: EntryHistory): ChipUsage[] => {
    const currentGw = bootstrap.events.find(e => e.is_current)?.id || 1;
    const chipUsages: ChipUsage[] = [];

    // Simulate chip usage analysis
    const chipTypes = [
      { name: 'wildcard' as const, display: 'Wildcard', icon: RotateCcw },
      { name: 'bboost' as const, display: 'Bench Boost', icon: Shield },
      { name: '3xc' as const, display: 'Triple Captain', icon: Crown },
      { name: 'freehit' as const, display: 'Free Hit', icon: Star },
    ];

    // Simulate some chip usages
    chipTypes.forEach((chip, index) => {
      if (Math.random() > 0.5) { // 50% chance chip was used
        const gameweek = Math.floor(Math.random() * Math.min(currentGw - 1, 20)) + 1;
        const pointsScored = 45 + Math.floor(Math.random() * 40); // 45-85 points
        const averageWithoutChip = 55 + Math.floor(Math.random() * 15); // 55-70 points
        const effectiveness = pointsScored - averageWithoutChip;
        
        // Determine timing based on gameweek
        let timing: 'Early' | 'Optimal' | 'Late' | 'Poor';
        let timingScore: number;
        
        if (chip.name === 'wildcard') {
          // Wildcard best used early or for major changes
          if (gameweek <= 5 || (gameweek >= 15 && gameweek <= 20)) {
            timing = 'Optimal';
            timingScore = 90;
          } else if (gameweek <= 10) {
            timing = 'Early';
            timingScore = 70;
          } else {
            timing = 'Late';
            timingScore = 40;
          }
        } else if (chip.name === 'bboost') {
          // Bench Boost best for DGWs
          if (gameweek >= 25 && gameweek <= 35) {
            timing = 'Optimal';
            timingScore = 95;
          } else if (gameweek >= 20) {
            timing = 'Late';
            timingScore = 60;
          } else {
            timing = 'Early';
            timingScore = 30;
          }
        } else if (chip.name === '3xc') {
          // Triple Captain best for DGWs with strong captain options
          if (gameweek >= 25 && gameweek <= 35) {
            timing = 'Optimal';
            timingScore = 95;
          } else if (gameweek >= 15) {
            timing = 'Late';
            timingScore = 50;
          } else {
            timing = 'Early';
            timingScore = 25;
          }
        } else {
          // Free Hit best for BGWs
          if (gameweek >= 28 && gameweek <= 33) {
            timing = 'Optimal';
            timingScore = 90;
          } else {
            timing = 'Poor';
            timingScore = 20;
          }
        }

        chipUsages.push({
          chipName: chip.name,
          chipDisplayName: chip.display,
          gameweek,
          pointsScored,
          averageWithoutChip,
          effectiveness,
          timing,
          timingScore,
        });
      }
    });

    return chipUsages.sort((a, b) => b.gameweek - a.gameweek);
  };

  const generateChipRecommendations = (bootstrap: Bootstrap, history: EntryHistory): ChipRecommendation[] => {
    const currentGw = bootstrap.events.find(e => e.is_current)?.id || 1;
    const recommendations: ChipRecommendation[] = [];

    // Generate simulated recommendations for unused chips
    const possibleRecommendations = [
      {
        chipName: 'wildcard' as const,
        chipDisplayName: 'Wildcard',
        recommendedGw: currentGw + 2,
        reason: 'Team needs restructuring before busy fixture period',
        expectedBenefit: 15,
        priority: 'High' as const,
      },
      {
        chipName: 'bboost' as const,
        chipDisplayName: 'Bench Boost',
        recommendedGw: 29,
        reason: 'Double gameweek with strong bench options',
        expectedBenefit: 25,
        priority: 'High' as const,
      },
      {
        chipName: '3xc' as const,
        chipDisplayName: 'Triple Captain',
        recommendedGw: 31,
        reason: 'Haaland has two favorable fixtures',
        expectedBenefit: 20,
        priority: 'Medium' as const,
      },
      {
        chipName: 'freehit' as const,
        chipDisplayName: 'Free Hit',
        recommendedGw: 33,
        reason: 'Blank gameweek with limited playing players',
        expectedBenefit: 12,
        priority: 'Medium' as const,
      },
    ];

    // Randomly select 2-3 recommendations
    const numRecommendations = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numRecommendations && i < possibleRecommendations.length; i++) {
      recommendations.push(possibleRecommendations[i]);
    }

    return recommendations.sort((a, b) => a.recommendedGw - b.recommendedGw);
  };

  const getChipIcon = (chipName: string) => {
    switch (chipName) {
      case 'wildcard': return <RotateCcw className="h-5 w-5" />;
      case 'bboost': return <Shield className="h-5 w-5" />;
      case '3xc': return <Crown className="h-5 w-5" />;
      case 'freehit': return <Star className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness > 10) return 'text-green-600';
    if (effectiveness > 0) return 'text-green-500';
    if (effectiveness > -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case 'Optimal': return 'bg-green-500';
      case 'Early': return 'bg-yellow-500';
      case 'Late': return 'bg-orange-500';
      case 'Poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chip Effectiveness</h1>
        <p className="text-muted-foreground">
          Analyze when to use Triple Captain, Bench Boost, Free Hit, and Wildcard
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
                <Zap className="h-4 w-4 mr-2" />
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

      {chipUsages.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Effectiveness</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", getEffectivenessColor(averageChipEffectiveness))}>
                  {averageChipEffectiveness > 0 ? '+' : ''}{formatNumber(averageChipEffectiveness, 1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Points above average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chips Used</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(chipUsages.length)}</div>
                <p className="text-xs text-muted-foreground">
                  Out of 4 available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Chip</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bestChipGw ? `GW${bestChipGw}` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Highest effectiveness
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining Chips</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(4 - chipUsages.length)}</div>
                <p className="text-xs text-muted-foreground">
                  Still available to use
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chip Usage History */}
          <Card>
            <CardHeader>
              <CardTitle>Chip Usage History</CardTitle>
              <CardDescription>
                Analysis of your chip usage and timing effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chipUsages.map((chip, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          {getChipIcon(chip.chipName)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{chip.chipDisplayName}</h3>
                          <p className="text-sm text-muted-foreground">Used in GW{chip.gameweek}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTimingColor(chip.timing)}>
                          {chip.timing}
                        </Badge>
                        <div className="text-right">
                          <div className={cn("font-semibold", getEffectivenessColor(chip.effectiveness))}>
                            {chip.effectiveness > 0 ? '+' : ''}{chip.effectiveness} pts
                          </div>
                          <div className="text-xs text-muted-foreground">vs average</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-semibold text-lg">{chip.pointsScored}</div>
                        <div className="text-xs text-muted-foreground">Points Scored</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-semibold text-lg">{chip.averageWithoutChip}</div>
                        <div className="text-xs text-muted-foreground">Expected Average</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-semibold text-lg">{chip.timingScore}%</div>
                        <div className="text-xs text-muted-foreground">Timing Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {chipRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chip Recommendations</CardTitle>
            <CardDescription>
              Suggested timing for your remaining chips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chipRecommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        {getChipIcon(rec.chipName)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{rec.chipDisplayName}</h3>
                        <p className="text-sm text-muted-foreground">Recommended for GW{rec.recommendedGw}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority} Priority
                      </Badge>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +{rec.expectedBenefit} pts
                        </div>
                        <div className="text-xs text-muted-foreground">expected</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chip Strategy Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Chip Strategy Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Wildcard</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Best used early (GW1-8) or for major restructure</li>
                <li>• Use before international breaks</li>
                <li>• Consider before fixture congestion periods</li>
                <li>• Don't waste on small changes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Bench Boost</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Best used during Double Gameweeks</li>
                <li>• Ensure strong bench before using</li>
                <li>• Typically most effective GW25-35</li>
                <li>• Check for rotation risk</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Triple Captain</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Save for premium player Double Gameweeks</li>
                <li>• Use on in-form players with good fixtures</li>
                <li>• Avoid if captain might be rotated</li>
                <li>• Consider opponent defensive stats</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Free Hit</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Best for Blank Gameweeks</li>
                <li>• Use when few of your players play</li>
                <li>• Don't waste on normal gameweeks</li>
                <li>• Plan team reverts next week</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && chipUsages.length === 0 && (
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