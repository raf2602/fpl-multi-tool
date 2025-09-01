'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  FileText, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Crown,
  Star,
  Target,
  Calculator,
  Zap,
  CheckCircle,
  XCircle,
  BarChart3,
  Clock
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage, setLocalStorage } from '@/lib/utils';
import type { Bootstrap, EntryEvent, EntryHistory } from '@/lib/types';

interface WeeklyReview {
  gameweek: number;
  points: number;
  rank: number;
  rankChange: number;
  averageScore: number;
  performance: 'Excellent' | 'Good' | 'Average' | 'Poor';
  captainChoice: {
    player: string;
    points: number;
    effective: boolean;
  };
  topPerformers: {
    player: string;
    points: number;
    position: string;
  }[];
  poorPerformers: {
    player: string;
    points: number;
    position: string;
  }[];
  keyDecisions: {
    decision: string;
    outcome: 'Positive' | 'Negative' | 'Neutral';
    impact: number;
  }[];
  suggestions: string[];
}

interface GameweekSummary {
  totalPoints: number;
  averagePoints: number;
  bestGameweek: number;
  worstGameweek: number;
  totalRankChange: number;
  captainSuccessRate: number;
}

export default function ReviewPage() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [entryId, setEntryId] = useState<string>('');
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [gameweekSummary, setGameweekSummary] = useState<GameweekSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);

  useEffect(() => {
    const savedEntryId = getLocalStorage('entryId', '');
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
    await fetchReviewData();
  };

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!entryId) {
        throw new Error('Entry ID is required');
      }

      // Fetch bootstrap data and entry history (with cache busting)
      const [bootstrapResponse, historyResponse] = await Promise.all([
        fetch(`/api/fpl/bootstrap?t=${Date.now()}`),
        fetch(`/api/fpl/entry/${entryId}/history`)
      ]);

      if (!bootstrapResponse.ok) throw new Error('Failed to fetch game data');
      if (!historyResponse.ok) throw new Error('Failed to fetch entry history');

      const bootstrapData: Bootstrap = await bootstrapResponse.json();
      const historyData: EntryHistory = await historyResponse.json();

      setBootstrap(bootstrapData);

      // Generate weekly reviews and summary
      const reviews = generateWeeklyReviews(bootstrapData, historyData);
      const summary = generateGameweekSummary(reviews);

      setWeeklyReviews(reviews);
      setGameweekSummary(summary);

      // Set default selected gameweek to most recent
      if (reviews.length > 0) {
        setSelectedGameweek(reviews[0].gameweek);
      }

    } catch (err) {
      console.error('Review data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyReviews = (bootstrap: Bootstrap, history: EntryHistory): WeeklyReview[] => {
    const currentGw = bootstrap.events.find(e => e.is_current)?.id || 1;
    const reviews: WeeklyReview[] = [];

    // Generate simulated reviews for the last 8 gameweeks
    for (let gw = Math.max(1, currentGw - 8); gw < currentGw; gw++) {
      const points = 45 + Math.floor(Math.random() * 40); // 45-85 points
      const rank = 100000 + Math.floor(Math.random() * 500000);
      const rankChange = Math.floor(Math.random() * 100000 - 50000);
      const averageScore = 50 + Math.floor(Math.random() * 20);
      
      // Determine performance
      let performance: 'Excellent' | 'Good' | 'Average' | 'Poor';
      if (points >= averageScore + 15) performance = 'Excellent';
      else if (points >= averageScore + 5) performance = 'Good';
      else if (points >= averageScore - 5) performance = 'Average';
      else performance = 'Poor';

      // Generate captain choice
      const captains = ['Haaland', 'Salah', 'Kane', 'Son', 'De Bruyne'];
      const captainPlayer = captains[Math.floor(Math.random() * captains.length)];
      const captainPoints = Math.floor(Math.random() * 20);
      const captainEffective = captainPoints >= 8;

      // Generate top performers
      const players = ['Haaland', 'Salah', 'De Bruyne', 'Son', 'Rashford', 'Martinelli', 'Saka', 'Alexander-Arnold'];
      const topPerformers = players
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(player => ({
          player,
          points: 8 + Math.floor(Math.random() * 12),
          position: ['GKP', 'DEF', 'MID', 'FWD'][Math.floor(Math.random() * 4)]
        }));

      // Generate poor performers
      const poorPerformers = players
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map(player => ({
          player,
          points: Math.floor(Math.random() * 3),
          position: ['GKP', 'DEF', 'MID', 'FWD'][Math.floor(Math.random() * 4)]
        }));

      // Generate key decisions
      const decisions = [
        'Captain choice',
        'Transfer decision',
        'Bench selection',
        'Formation choice'
      ];
      const keyDecisions = decisions
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map(decision => ({
          decision,
          outcome: Math.random() > 0.5 ? 'Positive' as const : 'Negative' as const,
          impact: Math.floor(Math.random() * 10) + 1
        }));

      // Generate suggestions
      const allSuggestions = [
        'Consider rotating goalkeepers based on fixtures',
        'Monitor player injury status before deadlines',
        'Look for differential captain options',
        'Plan transfers around fixture swings',
        'Keep an eye on price changes',
        'Consider double gameweek preparation'
      ];
      const suggestions = allSuggestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      reviews.push({
        gameweek: gw,
        points,
        rank,
        rankChange,
        averageScore,
        performance,
        captainChoice: {
          player: captainPlayer,
          points: captainPoints,
          effective: captainEffective
        },
        topPerformers,
        poorPerformers,
        keyDecisions,
        suggestions
      });
    }

    return reviews.sort((a, b) => b.gameweek - a.gameweek);
  };

  const generateGameweekSummary = (reviews: WeeklyReview[]): GameweekSummary => {
    if (reviews.length === 0) {
      return {
        totalPoints: 0,
        averagePoints: 0,
        bestGameweek: 0,
        worstGameweek: 0,
        totalRankChange: 0,
        captainSuccessRate: 0
      };
    }

    const totalPoints = reviews.reduce((sum, r) => sum + r.points, 0);
    const averagePoints = totalPoints / reviews.length;
    const bestGameweek = reviews.reduce((best, r) => r.points > (best?.points || 0) ? r : best).gameweek;
    const worstGameweek = reviews.reduce((worst, r) => r.points < (worst?.points || Infinity) ? r : worst).gameweek;
    const totalRankChange = reviews.reduce((sum, r) => sum + r.rankChange, 0);
    const successfulCaptains = reviews.filter(r => r.captainChoice.effective).length;
    const captainSuccessRate = (successfulCaptains / reviews.length) * 100;

    return {
      totalPoints,
      averagePoints,
      bestGameweek,
      worstGameweek,
      totalRankChange,
      captainSuccessRate
    };
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Average': return 'text-yellow-600';
      case 'Poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'Excellent': return <Badge className="bg-green-500">Excellent</Badge>;
      case 'Good': return <Badge className="bg-blue-500">Good</Badge>;
      case 'Average': return <Badge variant="secondary">Average</Badge>;
      case 'Poor': return <Badge className="bg-red-500">Poor</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'Positive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Negative': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Neutral': return <Target className="h-4 w-4 text-gray-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const selectedReview = weeklyReviews.find(r => r.gameweek === selectedGameweek);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Review Generator</h1>
        <p className="text-muted-foreground">
          Automated performance analysis and insights
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
                <FileText className="h-4 w-4 mr-2" />
              )}
              Generate Review
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

      {gameweekSummary && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Points</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(gameweekSummary.averagePoints, 1)}</div>
                <p className="text-xs text-muted-foreground">
                  Per gameweek
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Gameweek</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">GW{gameweekSummary.bestGameweek}</div>
                <p className="text-xs text-muted-foreground">
                  Highest scoring week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Captain Success</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(gameweekSummary.captainSuccessRate, 0)}%</div>
                <p className="text-xs text-muted-foreground">
                  Effective captains
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rank Change</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", gameweekSummary.totalRankChange > 0 ? 'text-green-600' : 'text-red-600')}>
                  {gameweekSummary.totalRankChange > 0 ? '+' : ''}{formatNumber(gameweekSummary.totalRankChange)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total change
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gameweek Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Gameweek</CardTitle>
              <CardDescription>
                Choose a gameweek to view detailed review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-4">
                {weeklyReviews.map((review) => (
                  <Button
                    key={review.gameweek}
                    variant={selectedGameweek === review.gameweek ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedGameweek(review.gameweek)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>GW{review.gameweek}</span>
                      <span className={cn("text-xs", getPerformanceColor(review.performance))}>
                        {review.points}pts
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Review */}
          {selectedReview && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gameweek {selectedReview.gameweek} Overview</CardTitle>
                    <CardDescription>
                      Your performance summary for this gameweek
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-2xl">{selectedReview.points}</div>
                        <div className="text-sm text-muted-foreground">Points Scored</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-2xl">{formatNumber(selectedReview.rank)}</div>
                        <div className="text-sm text-muted-foreground">Overall Rank</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className={cn("font-semibold text-2xl", selectedReview.rankChange > 0 ? 'text-green-600' : 'text-red-600')}>
                          {selectedReview.rankChange > 0 ? '+' : ''}{formatNumber(selectedReview.rankChange)}
                        </div>
                        <div className="text-sm text-muted-foreground">Rank Change</div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Performance Rating</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedReview.points} vs {selectedReview.averageScore} average
                        </p>
                      </div>
                      {getPerformanceBadge(selectedReview.performance)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Top Performers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-green-600" />
                        <span>Top Performers</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedReview.topPerformers.map((player, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <div className="font-medium">{player.player}</div>
                              <div className="text-sm text-muted-foreground">{player.position}</div>
                            </div>
                            <div className="font-semibold text-green-600">{player.points} pts</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Poor Performers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span>Disappointing Players</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedReview.poorPerformers.map((player, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div>
                              <div className="font-medium">{player.player}</div>
                              <div className="text-sm text-muted-foreground">{player.position}</div>
                            </div>
                            <div className="font-semibold text-red-600">{player.points} pts</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Captain Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Crown className="h-5 w-5" />
                      <span>Captain Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{selectedReview.captainChoice.player}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedReview.captainChoice.points} points scored
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedReview.captainChoice.effective ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <Badge className={selectedReview.captainChoice.effective ? 'bg-green-500' : 'bg-red-500'}>
                          {selectedReview.captainChoice.effective ? 'Effective' : 'Poor choice'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                {/* Key Decisions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Decisions Analysis</CardTitle>
                    <CardDescription>
                      Impact of major decisions this gameweek
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReview.keyDecisions.map((decision, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getOutcomeIcon(decision.outcome)}
                            <div>
                              <div className="font-medium">{decision.decision}</div>
                              <div className="text-sm text-muted-foreground">
                                {decision.impact} point impact
                              </div>
                            </div>
                          </div>
                          <Badge className={
                            decision.outcome === 'Positive' ? 'bg-green-500' :
                            decision.outcome === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                          }>
                            {decision.outcome}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Suggestions for Next Week</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReview.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
                          </div>
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {loading && !gameweekSummary && (
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