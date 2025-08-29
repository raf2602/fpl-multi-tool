import { 
  type Bootstrap, 
  type LiveGw, 
  type LeagueStandings, 
  type Entry, 
  type EntryHistory, 
  type EntryEvent, 
  type EntryTransfers, 
  type Fixture, 
  type ElementSummary,
  type SessionContext 
} from './types';
import { fplEndpoints, fplAuthEndpoints } from './endpoints';
import { 
  bootstrapCache, 
  fixturesCache, 
  liveCache, 
  standingsCache, 
  entryCache, 
  elementSummaryCache,
  withCache,
  cacheKeys 
} from './cache';
import { safeFetch, getErrorMessage } from './utils';

// Base fetch configuration
const DEFAULT_HEADERS = {
  'User-Agent': 'FPL-WebApp/1.0',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// Enhanced fetch with authentication context
async function fplFetch(
  url: string, 
  options: RequestInit = {}, 
  sessionContext?: SessionContext
): Promise<Response> {
  const headers = { ...DEFAULT_HEADERS, ...options.headers };
  
  // Add authentication cookies if available
  if (sessionContext?.cookies) {
    (headers as any).Cookie = sessionContext.cookies;
  }
  
  const response = await safeFetch(url, {
    ...options,
    headers,
  });
  
  return response;
}

// Public endpoints (no authentication required)

export async function fetchBootstrap(): Promise<Bootstrap> {
  return withCache(
    bootstrapCache,
    cacheKeys.bootstrap(),
    async () => {
      const response = await fplFetch(fplEndpoints.bootstrap());
      if (!response.ok) {
        throw new Error(`Failed to fetch bootstrap: ${response.statusText}`);
      }
      return response.json();
    },
    60 * 60 * 1000 // 1 hour cache
  );
}

export async function fetchFixtures(): Promise<Fixture[]> {
  return withCache(
    fixturesCache,
    cacheKeys.fixtures(),
    async () => {
      const response = await fplFetch(fplEndpoints.fixtures());
      if (!response.ok) {
        throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
      }
      return response.json();
    },
    60 * 60 * 1000 // 1 hour cache
  );
}

export async function fetchLiveGw(gw: number): Promise<LiveGw> {
  return withCache(
    liveCache,
    cacheKeys.liveGw(gw),
    async () => {
      const response = await fplFetch(fplEndpoints.liveGw(gw));
      if (!response.ok) {
        throw new Error(`Failed to fetch live GW ${gw}: ${response.statusText}`);
      }
      return response.json();
    },
    60 * 1000 // 1 minute cache for live data
  );
}

export async function fetchClassicStandings(
  leagueId: number, 
  page: number = 1
): Promise<LeagueStandings> {
  return withCache(
    standingsCache,
    cacheKeys.standings(leagueId, page),
    async () => {
      const response = await fplFetch(fplEndpoints.classicLeague(leagueId, page));
      if (!response.ok) {
        throw new Error(`Failed to fetch league standings: ${response.statusText}`);
      }
      return response.json();
    },
    10 * 60 * 1000 // 10 minutes cache
  );
}

export async function fetchElementSummary(playerId: number): Promise<ElementSummary> {
  return withCache(
    elementSummaryCache,
    cacheKeys.elementSummary(playerId),
    async () => {
      const response = await fplFetch(fplEndpoints.elementSummary(playerId));
      if (!response.ok) {
        throw new Error(`Failed to fetch element summary: ${response.statusText}`);
      }
      return response.json();
    },
    30 * 60 * 1000 // 30 minutes cache
  );
}

// Authenticated endpoints (require session context)

export async function fetchEntry(
  entryId: number, 
  sessionContext?: SessionContext
): Promise<Entry> {
  const cacheKey = sessionContext 
    ? `${cacheKeys.entry(entryId)}-auth`
    : cacheKeys.entry(entryId);
    
  return withCache(
    entryCache,
    cacheKey,
    async () => {
      const response = await fplFetch(
        fplAuthEndpoints.entry(entryId), 
        {}, 
        sessionContext
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch entry: ${response.statusText}`);
      }
      return response.json();
    },
    sessionContext ? 60 * 1000 : 10 * 60 * 1000 // 1 min if auth, 10 min if public
  );
}

export async function fetchEntryHistory(
  entryId: number, 
  sessionContext?: SessionContext
): Promise<EntryHistory> {
  const cacheKey = sessionContext 
    ? `${cacheKeys.entryHistory(entryId)}-auth`
    : cacheKeys.entryHistory(entryId);
    
  return withCache(
    entryCache,
    cacheKey,
    async () => {
      const response = await fplFetch(
        fplAuthEndpoints.entryHistory(entryId), 
        {}, 
        sessionContext
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch entry history: ${response.statusText}`);
      }
      return response.json();
    },
    sessionContext ? 5 * 60 * 1000 : 30 * 60 * 1000 // 5 min if auth, 30 min if public
  );
}

export async function fetchEntryEvent(
  entryId: number, 
  gw: number, 
  sessionContext?: SessionContext
): Promise<EntryEvent> {
  const cacheKey = sessionContext 
    ? `${cacheKeys.entryEvent(entryId, gw)}-auth`
    : cacheKeys.entryEvent(entryId, gw);
    
  return withCache(
    entryCache,
    cacheKey,
    async () => {
      const response = await fplFetch(
        fplAuthEndpoints.entryEvent(entryId, gw), 
        {}, 
        sessionContext
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch entry event: ${response.statusText}`);
      }
      return response.json();
    },
    sessionContext ? 60 * 1000 : 10 * 60 * 1000 // 1 min if auth, 10 min if public
  );
}

export async function fetchEntryTransfers(
  entryId: number, 
  sessionContext?: SessionContext
): Promise<EntryTransfers> {
  const cacheKey = sessionContext 
    ? `${cacheKeys.entryTransfers(entryId)}-auth`
    : cacheKeys.entryTransfers(entryId);
    
  return withCache(
    entryCache,
    cacheKey,
    async () => {
      const response = await fplFetch(
        fplAuthEndpoints.entryTransfers(entryId), 
        {}, 
        sessionContext
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch entry transfers: ${response.statusText}`);
      }
      return response.json();
    },
    sessionContext ? 60 * 1000 : 10 * 60 * 1000 // 1 min if auth, 10 min if public
  );
}

// Batch operations for efficiency

export async function fetchMultipleEntries(
  entryIds: number[], 
  sessionContext?: SessionContext
): Promise<(Entry | null)[]> {
  const promises = entryIds.map(async (entryId) => {
    try {
      return await fetchEntry(entryId, sessionContext);
    } catch (error) {
      console.warn(`Failed to fetch entry ${entryId}:`, getErrorMessage(error));
      return null;
    }
  });
  
  return Promise.all(promises);
}

export async function fetchMultipleEntryEvents(
  entryIds: number[], 
  gw: number, 
  sessionContext?: SessionContext
): Promise<(EntryEvent | null)[]> {
  const promises = entryIds.map(async (entryId) => {
    try {
      return await fetchEntryEvent(entryId, gw, sessionContext);
    } catch (error) {
      console.warn(`Failed to fetch entry event ${entryId}/${gw}:`, getErrorMessage(error));
      return null;
    }
  });
  
  return Promise.all(promises);
}

export async function fetchLeagueEntries(
  leagueId: number,
  sessionContext?: SessionContext
): Promise<{ standings: LeagueStandings; entries: (Entry | null)[] }> {
  // First get the standings
  const standings = await fetchClassicStandings(leagueId);
  
  // Extract entry IDs
  const entryIds = standings.standings.results.map(result => result.entry);
  
  // Fetch all entries in parallel
  const entries = await fetchMultipleEntries(entryIds, sessionContext);
  
  return { standings, entries };
}

// Utility functions for common data operations

export async function getCurrentGameweek(): Promise<number> {
  try {
    const bootstrap = await fetchBootstrap();
    const currentEvent = bootstrap.events.find(event => event.is_current);
    return currentEvent?.id || 1;
  } catch (error) {
    console.warn('Failed to get current gameweek:', getErrorMessage(error));
    return 1; // Fallback to GW1
  }
}

export async function getNextGameweek(): Promise<number | null> {
  try {
    const bootstrap = await fetchBootstrap();
    const nextEvent = bootstrap.events.find(event => event.is_next);
    return nextEvent?.id || null;
  } catch (error) {
    console.warn('Failed to get next gameweek:', getErrorMessage(error));
    return null;
  }
}

export async function isGameweekFinished(gw: number): Promise<boolean> {
  try {
    const bootstrap = await fetchBootstrap();
    const event = bootstrap.events.find(event => event.id === gw);
    return event?.finished || false;
  } catch (error) {
    console.warn('Failed to check if gameweek is finished:', getErrorMessage(error));
    return false;
  }
}

export async function getGameweekDeadline(gw: number): Promise<string | null> {
  try {
    const bootstrap = await fetchBootstrap();
    const event = bootstrap.events.find(event => event.id === gw);
    return event?.deadline_time || null;
  } catch (error) {
    console.warn('Failed to get gameweek deadline:', getErrorMessage(error));
    return null;
  }
}

// Player data utilities

export async function getPlayerById(playerId: number): Promise<Bootstrap['elements'][0] | null> {
  try {
    const bootstrap = await fetchBootstrap();
    return bootstrap.elements.find(element => element.id === playerId) || null;
  } catch (error) {
    console.warn('Failed to get player by ID:', getErrorMessage(error));
    return null;
  }
}

export async function getPlayersByTeam(teamId: number): Promise<Bootstrap['elements']> {
  try {
    const bootstrap = await fetchBootstrap();
    return bootstrap.elements.filter(element => element.team === teamId);
  } catch (error) {
    console.warn('Failed to get players by team:', getErrorMessage(error));
    return [];
  }
}

export async function getPlayersByPosition(positionId: number): Promise<Bootstrap['elements']> {
  try {
    const bootstrap = await fetchBootstrap();
    return bootstrap.elements.filter(element => element.element_type === positionId);
  } catch (error) {
    console.warn('Failed to get players by position:', getErrorMessage(error));
    return [];
  }
}

// Team data utilities

export async function getTeamById(teamId: number): Promise<Bootstrap['teams'][0] | null> {
  try {
    const bootstrap = await fetchBootstrap();
    return bootstrap.teams.find(team => team.id === teamId) || null;
  } catch (error) {
    console.warn('Failed to get team by ID:', getErrorMessage(error));
    return null;
  }
}

export async function getAllTeams(): Promise<Bootstrap['teams']> {
  try {
    const bootstrap = await fetchBootstrap();
    return bootstrap.teams;
  } catch (error) {
    console.warn('Failed to get all teams:', getErrorMessage(error));
    return [];
  }
}

// Health check and diagnostics

export async function healthCheck(): Promise<{
  status: 'ok' | 'error';
  endpoints: Record<string, boolean>;
  latency: Record<string, number>;
}> {
  const results: {
    status: 'ok' | 'error';
    endpoints: Record<string, boolean>;
    latency: Record<string, number>;
  } = {
    status: 'ok',
    endpoints: {},
    latency: {},
  };

  const tests = [
    { name: 'bootstrap', test: () => fetchBootstrap() },
    { name: 'fixtures', test: () => fetchFixtures() },
  ];

  for (const { name, test } of tests) {
    const start = Date.now();
    try {
      await test();
      results.endpoints[name] = true;
      results.latency[name] = Date.now() - start;
    } catch (error) {
      results.endpoints[name] = false;
      results.latency[name] = Date.now() - start;
      results.status = 'error';
      console.warn(`Health check failed for ${name}:`, getErrorMessage(error));
    }
  }

  return results;
}

// Rate limiting utilities

let requestCount = 0;
let resetTime = Date.now() + 60000; // Reset every minute

export function checkRateLimit(): boolean {
  const now = Date.now();
  
  if (now > resetTime) {
    requestCount = 0;
    resetTime = now + 60000;
  }
  
  if (requestCount >= 100) { // 100 requests per minute
    return false;
  }
  
  requestCount++;
  return true;
}

export function getRateLimitStatus(): { remaining: number; resetTime: number } {
  const now = Date.now();
  
  if (now > resetTime) {
    requestCount = 0;
    resetTime = now + 60000;
  }
  
  return {
    remaining: Math.max(0, 100 - requestCount),
    resetTime,
  };
}
