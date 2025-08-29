import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBootstrap, fetchFixtures, getCurrentGameweek } from '@/lib/fpl';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FPL Public API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBootstrap', () => {
    it('should fetch and return bootstrap data', async () => {
      const mockBootstrapData = {
        events: [
          { id: 1, is_current: false, is_next: false },
          { id: 2, is_current: true, is_next: false },
        ],
        elements: [
          { id: 1, web_name: 'Salah', team: 1, element_type: 3 },
          { id: 2, web_name: 'Kane', team: 2, element_type: 4 },
        ],
        teams: [
          { id: 1, name: 'Liverpool', short_name: 'LIV' },
          { id: 2, name: 'Tottenham', short_name: 'TOT' },
        ],
        element_types: [
          { id: 1, singular_name_short: 'GKP' },
          { id: 2, singular_name_short: 'DEF' },
          { id: 3, singular_name_short: 'MID' },
          { id: 4, singular_name_short: 'FWD' },
        ],
        total_players: 1000000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBootstrapData,
      });

      const result = await fetchBootstrap();
      expect(result).toEqual(mockBootstrapData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://fantasy.premierleague.com/api/bootstrap-static/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'FPL-WebApp/1.0',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error',
      });

      await expect(fetchBootstrap()).rejects.toThrow('Failed to fetch bootstrap: Server Error');
    });
  });

  describe('fetchFixtures', () => {
    it('should fetch and return fixtures data', async () => {
      const mockFixturesData = [
        {
          id: 1,
          event: 1,
          team_h: 1,
          team_a: 2,
          team_h_score: null,
          team_a_score: null,
          finished: false,
          kickoff_time: '2024-08-17T11:30:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFixturesData,
      });

      const result = await fetchFixtures();
      expect(result).toEqual(mockFixturesData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://fantasy.premierleague.com/api/fixtures/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'FPL-WebApp/1.0',
          }),
        })
      );
    });
  });

  describe('getCurrentGameweek', () => {
    it('should return current gameweek from bootstrap data', async () => {
      const mockBootstrapData = {
        events: [
          { id: 1, is_current: false, is_next: false },
          { id: 2, is_current: true, is_next: false },
          { id: 3, is_current: false, is_next: true },
        ],
        elements: [],
        teams: [],
        element_types: [],
        total_players: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBootstrapData,
      });

      const result = await getCurrentGameweek();
      expect(result).toBe(2);
    });

    it('should return 1 if no current gameweek found', async () => {
      const mockBootstrapData = {
        events: [
          { id: 1, is_current: false, is_next: false },
          { id: 2, is_current: false, is_next: false },
        ],
        elements: [],
        teams: [],
        element_types: [],
        total_players: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBootstrapData,
      });

      const result = await getCurrentGameweek();
      expect(result).toBe(1);
    });

    it('should return 1 on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getCurrentGameweek();
      expect(result).toBe(1);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // This test would verify rate limiting functionality
      // For now, we'll just check that the function exists
      const { checkRateLimit, getRateLimitStatus } = await import('@/lib/fpl');
      
      expect(typeof checkRateLimit).toBe('function');
      expect(typeof getRateLimitStatus).toBe('function');
      
      const status = getRateLimitStatus();
      expect(status).toMatchObject({
        remaining: expect.any(Number),
        resetTime: expect.any(Number),
      });
    });
  });
});
