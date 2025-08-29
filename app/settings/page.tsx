'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  Settings as SettingsIcon, 
  Users, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  Info,
  Save,
  RotateCcw
} from 'lucide-react';
import { cn, formatNumber, getLocalStorage, setLocalStorage, isNumber } from '@/lib/utils';
import type { LeagueStandings } from '@/lib/types';

interface SettingsData {
  leagueId: number | null;
  entryIds: number[];
  preferences: {
    refreshInterval: number;
    defaultGw: 'current' | 'latest';
    showAdvancedStats: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    leagueId: null,
    entryIds: [],
    preferences: {
      refreshInterval: 60,
      defaultGw: 'current',
      showAdvancedStats: false,
    },
  });
  
  const [tempLeagueId, setTempLeagueId] = useState<string>('');
  const [tempEntryId, setTempEntryId] = useState<string>('');
  const [leagueData, setLeagueData] = useState<LeagueStandings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validatingLeague, setValidatingLeague] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedLeagueId = getLocalStorage<number | null>('fpl-league-id', null);
    const savedEntryIds = getLocalStorage<number[]>('fpl-entry-ids', []);
    const savedPreferences = getLocalStorage('fpl-preferences', settings.preferences);
    
    setSettings({
      leagueId: savedLeagueId,
      entryIds: savedEntryIds,
      preferences: savedPreferences,
    });
    
    if (savedLeagueId) {
      setTempLeagueId(savedLeagueId.toString());
      validateLeague(savedLeagueId);
    }
  };

  const validateLeague = async (leagueId: number) => {
    try {
      setValidatingLeague(true);
      setError(null);
      
      const response = await fetch(`/api/fpl/league/${leagueId}/standings`);
      if (!response.ok) {
        throw new Error('League not found or is private');
      }
      
      const data: LeagueStandings = await response.json();
      setLeagueData(data);
    } catch (err) {
      console.error('League validation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate league');
      setLeagueData(null);
    } finally {
      setValidatingLeague(false);
    }
  };

  const handleLeagueSubmit = async () => {
    const leagueId = parseInt(tempLeagueId, 10);
    
    if (!isNumber(leagueId) || leagueId <= 0) {
      setError('Please enter a valid league ID');
      return;
    }
    
    await validateLeague(leagueId);
    
    if (!error) {
      const newSettings = { ...settings, leagueId };
      setSettings(newSettings);
      setLocalStorage('fpl-league-id', leagueId);
      setSuccess('League updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleAddEntry = () => {
    const entryId = parseInt(tempEntryId, 10);
    
    if (!isNumber(entryId) || entryId <= 0) {
      setError('Please enter a valid entry ID');
      return;
    }
    
    if (settings.entryIds.includes(entryId)) {
      setError('Entry ID already added');
      return;
    }
    
    const newEntryIds = [...settings.entryIds, entryId];
    const newSettings = { ...settings, entryIds: newEntryIds };
    setSettings(newSettings);
    setLocalStorage('fpl-entry-ids', newEntryIds);
    setTempEntryId('');
    setError(null);
    setSuccess('Entry added successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveEntry = (entryId: number) => {
    const newEntryIds = settings.entryIds.filter(id => id !== entryId);
    const newSettings = { ...settings, entryIds: newEntryIds };
    setSettings(newSettings);
    setLocalStorage('fpl-entry-ids', newEntryIds);
  };

  const handleSavePreferences = () => {
    setLocalStorage('fpl-preferences', settings.preferences);
    setSuccess('Preferences saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
      // Clear localStorage
      localStorage.removeItem('fpl-league-id');
      localStorage.removeItem('fpl-entry-ids');
      localStorage.removeItem('fpl-preferences');
      
      // Reset state
      setSettings({
        leagueId: null,
        entryIds: [],
        preferences: {
          refreshInterval: 60,
          defaultGw: 'current',
          showAdvancedStats: false,
        },
      });
      setTempLeagueId('');
      setTempEntryId('');
      setLeagueData(null);
      setError(null);
      setSuccess('Settings reset successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your league, entries, and preferences for the best analysis experience
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* League Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>League Configuration</span>
          </CardTitle>
          <CardDescription>
            Set your FPL classic league to unlock all analysis features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="league-id" className="text-sm font-medium">
              League ID
            </label>
            <div className="flex space-x-2">
              <Input
                id="league-id"
                type="number"
                placeholder="Enter your league ID (e.g. 123456)"
                value={tempLeagueId}
                onChange={(e) => setTempLeagueId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleLeagueSubmit}
                disabled={validatingLeague || !tempLeagueId}
              >
                {validatingLeague ? 'Validating...' : 'Validate'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find this in your FPL league URL: fantasy.premierleague.com/leagues/<strong>123456</strong>/standings
            </p>
          </div>

          {leagueData && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{leagueData.league.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(leagueData.standings.results.length)} managers • {leagueData.league.league_type}
                  </p>
                </div>
                <Badge variant="secondary">
                  <Check className="h-3 w-3 mr-1" />
                  Validated
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry IDs */}
      <Card>
        <CardHeader>
          <CardTitle>Entry IDs (Optional)</CardTitle>
          <CardDescription>
            Add specific team/entry IDs for enhanced personal analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="entry-id" className="text-sm font-medium">
              Add Entry ID
            </label>
            <div className="flex space-x-2">
              <Input
                id="entry-id"
                type="number"
                placeholder="Enter team/entry ID"
                value={tempEntryId}
                onChange={(e) => setTempEntryId(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddEntry}
                disabled={!tempEntryId}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Find this in your team URL: fantasy.premierleague.com/entry/<strong>123456</strong>/
            </p>
          </div>

          {settings.entryIds.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Configured Entries</h4>
              <div className="flex flex-wrap gap-2">
                {settings.entryIds.map((entryId) => (
                  <Badge key={entryId} variant="outline" className="flex items-center space-x-1">
                    <span>{entryId}</span>
                    <button
                      onClick={() => handleRemoveEntry(entryId)}
                      className="hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-5 w-5" />
            <span>Preferences</span>
          </CardTitle>
          <CardDescription>
            Customize how the app behaves and displays data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="refresh-interval" className="text-sm font-medium">
                Auto Refresh Interval (seconds)
              </label>
              <Input
                id="refresh-interval"
                type="number"
                min="30"
                max="300"
                value={settings.preferences.refreshInterval}
                onChange={(e) => setSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    refreshInterval: parseInt(e.target.value, 10) || 60,
                  },
                })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="default-gw" className="text-sm font-medium">
                Default Gameweek
              </label>
              <select
                id="default-gw"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.preferences.defaultGw}
                onChange={(e) => setSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    defaultGw: e.target.value as 'current' | 'latest',
                  },
                })}
              >
                <option value="current">Current GW</option>
                <option value="latest">Latest Completed GW</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="advanced-stats"
              checked={settings.preferences.showAdvancedStats}
              onChange={(e) => setSettings({
                ...settings,
                preferences: {
                  ...settings.preferences,
                  showAdvancedStats: e.target.checked,
                },
              })}
              className="rounded border-input"
            />
            <label htmlFor="advanced-stats" className="text-sm font-medium">
              Show advanced statistics by default
            </label>
          </div>

          <Button onClick={handleSavePreferences}>
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage your settings and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={loadSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reload Settings
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Privacy Note</AlertTitle>
        <AlertDescription>
          All settings are stored locally in your browser. No personal data is sent to our servers.
          League and entry data is fetched directly from the official FPL API.
        </AlertDescription>
      </Alert>
    </div>
  );
}
