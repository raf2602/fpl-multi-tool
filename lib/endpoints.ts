// FPL API base URLs
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const FPL_LOGIN_URL = 'https://users.premierleague.com/accounts/login/';

// Public endpoints (no authentication required)
export const fplEndpoints = {
  // Bootstrap static data (teams, players, gameweeks, etc.)
  bootstrap: () => `${FPL_BASE_URL}/bootstrap-static/`,
  
  // All fixtures for the season
  fixtures: () => `${FPL_BASE_URL}/fixtures/`,
  
  // Live gameweek data with player stats
  liveGw: (gw: number) => `${FPL_BASE_URL}/event/${gw}/live/`,
  
  // Classic league standings
  classicLeague: (leagueId: number, page: number = 1) => 
    `${FPL_BASE_URL}/leagues-classic/${leagueId}/standings/?page_standings=${page}`,
  
  // Player summary with fixtures and history
  elementSummary: (playerId: number) => `${FPL_BASE_URL}/element-summary/${playerId}/`,
  
  // Gameweek stats for all players
  eventStats: (gw: number) => `${FPL_BASE_URL}/event/${gw}/stats/`,
  
  // Dream team for a gameweek
  dreamTeam: (gw: number) => `${FPL_BASE_URL}/event/${gw}/dream-team/`,
} as const;

// Authenticated endpoints (require session cookies)
export const fplAuthEndpoints = {
  // Manager/entry basic info
  entry: (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/`,
  
  // Manager's historical data and chips used
  entryHistory: (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/history/`,
  
  // Manager's team for a specific gameweek
  entryEvent: (entryId: number, gw: number) => 
    `${FPL_BASE_URL}/entry/${entryId}/event/${gw}/`,
  
  // Manager's transfer history
  entryTransfers: (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/transfers/`,
  
  // Manager's current team
  entryPicks: (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/team/`,
  
  // Manager's mini-leagues
  entryLeagues: (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/leagues/`,
  
  // Manager's cup status
  entryCup: (entryId: number) => `${FPL_BASE_URL}/entry/${entryId}/cup/`,
} as const;

// Login endpoint
export const loginEndpoint = () => FPL_LOGIN_URL;

// Internal API endpoints (our Next.js API routes)
export const apiEndpoints = {
  // FPL data proxies
  fpl: {
    bootstrap: () => '/api/fpl/bootstrap',
    fixtures: () => '/api/fpl/fixtures',
    liveGw: (gw: number) => `/api/fpl/live/${gw}`,
    classicLeague: (leagueId: number) => `/api/fpl/league/${leagueId}/standings`,
    elementSummary: (playerId: number) => `/api/fpl/element/${playerId}/summary`,
    entry: (entryId: number) => `/api/fpl/entry/${entryId}`,
    entryHistory: (entryId: number) => `/api/fpl/entry/${entryId}/history`,
    entryEvent: (entryId: number, gw: number) => `/api/fpl/entry/${entryId}/event/${gw}`,
    entryTransfers: (entryId: number) => `/api/fpl/entry/${entryId}/transfers`,
  },
  
  // Authentication
  auth: {
    login: () => '/api/auth/login',
    setCookie: () => '/api/auth/set-cookie',
    logout: () => '/api/auth/logout',
    status: () => '/api/auth/status',
  },
  
  // State management
  state: {
    save: () => '/api/state/save',
    load: () => '/api/state/load',
  },
  
  // Calculated data
  calc: {
    luck: (leagueId: number) => `/api/calc/luck?league=${leagueId}`,
    captainRoi: (leagueId: number, gw?: number) => 
      `/api/calc/captain-roi?league=${leagueId}${gw ? `&gw=${gw}` : ''}`,
    effectiveOwnership: (leagueId: number, gw: number) => 
      `/api/calc/effective-ownership?league=${leagueId}&gw=${gw}`,
    template: (leagueId: number, gw: number) => 
      `/api/calc/template?league=${leagueId}&gw=${gw}`,
    transfers: (leagueId: number, gw?: number) => 
      `/api/calc/transfers?league=${leagueId}${gw ? `&gw=${gw}` : ''}`,
    chips: (leagueId: number) => `/api/calc/chips?league=${leagueId}`,
    fixtures: (teamId?: number) => `/api/calc/fixtures${teamId ? `?team=${teamId}` : ''}`,
    review: (leagueId: number, gw: number) => 
      `/api/calc/review?league=${leagueId}&gw=${gw}`,
  },
} as const;

// URL parameter builders
export const urlParams = {
  // Build query string from object
  build: (params: Record<string, string | number | boolean | undefined>): string => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  },
  
  // Parse query string to object
  parse: (url: string): Record<string, string> => {
    const urlObj = new URL(url, 'http://localhost');
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  },
} as const;

// Common query parameter builders
export const queryBuilders = {
  pagination: (page: number = 1, pageSize: number = 50) => ({
    page: page.toString(),
    page_size: pageSize.toString(),
  }),
  
  gameweek: (gw?: number) => gw ? { gw: gw.toString() } : {},
  
  league: (leagueId?: number) => leagueId ? { league: leagueId.toString() } : {},
  
  entry: (entryId?: number) => entryId ? { entry: entryId.toString() } : {},
  
  dateRange: (from?: string, to?: string) => ({
    ...(from && { from }),
    ...(to && { to }),
  }),
} as const;

// Validation helpers
export const validators = {
  gameweek: (gw: number): boolean => gw >= 1 && gw <= 38,
  
  entryId: (entryId: number): boolean => entryId > 0 && entryId < 10000000,
  
  leagueId: (leagueId: number): boolean => leagueId > 0,
  
  playerId: (playerId: number): boolean => playerId > 0 && playerId < 1000,
  
  teamId: (teamId: number): boolean => teamId >= 1 && teamId <= 20,
} as const;

// URL building utilities
export function buildApiUrl(
  endpoint: string, 
  params?: Record<string, string | number | boolean | undefined>
): string {
  const baseUrl = endpoint;
  const queryString = params ? urlParams.build(params) : '';
  return `${baseUrl}${queryString}`;
}

export function buildFplUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const baseUrl = endpoint;
  const queryString = params ? urlParams.build(params) : '';
  return `${baseUrl}${queryString}`;
}

// Common URL patterns
export const commonUrls = {
  // Dashboard with league
  dashboard: (leagueId?: number) => 
    leagueId ? `/?league=${leagueId}` : '/',
  
  // Live leaderboard
  live: (leagueId?: number, gw?: number) => {
    const params = { ...queryBuilders.league(leagueId), ...queryBuilders.gameweek(gw) };
    return buildApiUrl('/live', params);
  },
  
  // Manager profile
  manager: (entryId: number) => `/manager/${entryId}`,
  
  // Player profile
  player: (playerId: number) => `/player/${playerId}`,
  
  // Team profile
  team: (teamId: number) => `/team/${teamId}`,
} as const;

// Error handling for URLs
export function safeUrl(urlBuilder: () => string, fallback: string = '/'): string {
  try {
    return urlBuilder();
  } catch (error) {
    console.warn('Failed to build URL:', error);
    return fallback;
  }
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url, 'http://localhost');
    return true;
  } catch {
    return false;
  }
}

// Extract parameters from pathname
export function extractParams(pathname: string, pattern: string): Record<string, string> {
  const patternParts = pattern.split('/');
  const pathnameParts = pathname.split('/');
  const params: Record<string, string> = {};
  
  patternParts.forEach((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1);
      const value = pathnameParts[index];
      if (value) {
        params[paramName] = value;
      }
    }
  });
  
  return params;
}

// Default values for common parameters
export const defaults = {
  leagueId: () => {
    const envDefault = process.env.DEFAULT_LEAGUE_ID;
    return envDefault ? parseInt(envDefault, 10) : undefined;
  },
  
  gameweek: () => {
    // This would typically come from bootstrap data
    // For now, return a sensible default
    return 1;
  },
  
  pageSize: 50,
  cacheTime: 60, // seconds
} as const;
