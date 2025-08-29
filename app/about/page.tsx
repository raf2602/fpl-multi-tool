'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Code, Github, Lightbulb, Zap, Users, TrendingUp, Activity, Calendar } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">About FPL Multi-Tool</h1>
        <p className="text-muted-foreground mt-2">
          The story behind this comprehensive Fantasy Premier League analysis platform
        </p>
      </div>

      {/* Main About Section */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>About the Developer</span>
          </CardTitle>
          <CardDescription>
            How this FPL Multi-Tool was built and the story behind it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center space-x-2 mb-2">
                  <Lightbulb className="h-4 w-4" />
                  <span>The Idea</span>
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As an avid FPL player, I found myself constantly switching between multiple websites 
                  and manually calculating statistics to analyze my team's performance. I wanted a 
                  single tool that could provide comprehensive insights without the hassle.
                </p>
              </div>
              <div>
                <h4 className="font-semibold flex items-center space-x-2 mb-2">
                  <Code className="h-4 w-4" />
                  <span>Technical Stack</span>
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Built with Next.js 14 (App Router), TypeScript, and Tailwind CSS for a modern, 
                  type-safe experience. Uses shadcn/ui for beautiful components and integrates 
                  directly with the official FPL API for real-time data.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Key Features I Built:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>No Authentication Required</strong> - Uses public FPL APIs</li>
                  <li>• <strong>Real Data Only</strong> - No simulated or fake information</li>
                  <li>• <strong>Dark Mode Toggle</strong> - Respects system preferences</li>
                  <li>• <strong>Responsive Design</strong> - Works on all devices</li>
                  <li>• <strong>Smart Caching</strong> - Fast performance with optimized data fetching</li>
                  <li>• <strong>Type Safety</strong> - Full TypeScript implementation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Development Approach:</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Focused on clean code, user experience, and accurate data presentation. 
                  Each analysis tool was carefully designed to provide actionable insights 
                  for FPL managers at all skill levels.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button asChild variant="outline" size="sm">
              <a href="https://github.com/raf2602/fpl-multi-tool" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                View Source Code
              </a>
            </Button>
            <Badge variant="secondary">Next.js 14</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="secondary">FPL API</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tools Overview */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Available Analysis Tools</span>
          </CardTitle>
          <CardDescription>
            Comprehensive insights for every aspect of your FPL management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Activity className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Live League Leaderboard</h4>
                  <p className="text-sm text-muted-foreground">Real-time league standings and performance tracking</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Luck vs Median Analysis</h4>
                  <p className="text-sm text-muted-foreground">Compare your points against the median to measure luck</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Effective Ownership</h4>
                  <p className="text-sm text-muted-foreground">Calculate weighted ownership including captaincy</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Fixture Run Planner</h4>
                  <p className="text-sm text-muted-foreground">Analyze upcoming fixture difficulty with color coding</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="h-5 w-5 bg-yellow-500 rounded mt-0.5 flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-black">C</span>
                </div>
                <div>
                  <h4 className="font-medium">Captain ROI Tracker</h4>
                  <p className="text-sm text-muted-foreground">Analyze captaincy decisions and their effectiveness</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-5 w-5 bg-red-500 rounded mt-0.5 flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">T</span>
                </div>
                <div>
                  <h4 className="font-medium">Transfer Impact Analysis</h4>
                  <p className="text-sm text-muted-foreground">Track transfer activity and costs with real data</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Chip Effectiveness</h4>
                  <p className="text-sm text-muted-foreground">Monitor usage and timing of all chip types</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="h-5 w-5 bg-indigo-500 rounded mt-0.5 flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">R</span>
                </div>
                <div>
                  <h4 className="font-medium">Weekly Review Generator</h4>
                  <p className="text-sm text-muted-foreground">Automated performance reviews with insights</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
          <CardDescription>
            Modern web development practices and technologies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-2">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Next.js 14 App Router</li>
                <li>• TypeScript for type safety</li>
                <li>• Tailwind CSS for styling</li>
                <li>• shadcn/ui components</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Data & Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Official FPL API integration</li>
                <li>• Smart caching strategies</li>
                <li>• Server-side data fetching</li>
                <li>• Real-time updates</li>
                <li>• Error handling & recovery</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Quality & Standards</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• ESLint & Prettier</li>
                <li>• Unit testing with Vitest</li>
                <li>• Zod validation</li>
                <li>• Clean architecture</li>
                <li>• Accessible design</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Ready to analyze your FPL performance?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/settings">
                Set Up Your League
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/">
                View Dashboard
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://github.com/raf2602/fpl-multi-tool" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub Repository
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
