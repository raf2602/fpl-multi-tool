import { describe, it, expect } from 'vitest';
import { 
  currentGw, 
  leagueMedian, 
  calculateLuck,
  calculateEffectiveOwnership
} from '@/lib/calc';
import type { Bootstrap, EntryEvent } from '@/lib/types';

describe('Calculation Functions', () => {
  describe('currentGw', () => {
    it('should return current gameweek ID', () => {
      const bootstrap: Partial<Bootstrap> = {
        events: [
          { id: 1, is_current: false, is_next: false } as any,
          { id: 2, is_current: true, is_next: false } as any,
          { id: 3, is_current: false, is_next: true } as any,
        ],
      };
      
      expect(currentGw(bootstrap as Bootstrap)).toBe(2);
    });

    it('should return 1 if no current gameweek found', () => {
      const bootstrap: Partial<Bootstrap> = {
        events: [
          { id: 1, is_current: false, is_next: false } as any,
          { id: 2, is_current: false, is_next: false } as any,
        ],
      };
      
      expect(currentGw(bootstrap as Bootstrap)).toBe(1);
    });
  });

  describe('leagueMedian', () => {
    it('should calculate median correctly for odd number of entries', () => {
      const points = [10, 20, 30, 40, 50];
      expect(leagueMedian(points)).toBe(30);
    });

    it('should calculate median correctly for even number of entries', () => {
      const points = [10, 20, 30, 40];
      expect(leagueMedian(points)).toBe(25);
    });

    it('should handle single entry', () => {
      const points = [42];
      expect(leagueMedian(points)).toBe(42);
    });

    it('should handle empty array', () => {
      const points: number[] = [];
      expect(leagueMedian(points)).toBe(0);
    });
  });

  describe('calculateLuck', () => {
    it('should calculate luck correctly', () => {
      const entryData = [
        { entryId: 1, gwPoints: [50, 60, 70] },
        { entryId: 2, gwPoints: [40, 50, 60] },
        { entryId: 3, gwPoints: [30, 40, 50] },
      ];

      const result = calculateLuck(entryData, 3);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        entry_id: 1,
        gw_points: [50, 60, 70],
        luck_scores: expect.any(Array),
        cumulative_luck: expect.any(Number),
      });
    });

    it('should handle missing gameweek data', () => {
      const entryData = [
        { entryId: 1, gwPoints: [50] }, // Missing GW2, GW3
        { entryId: 2, gwPoints: [40, 50] }, // Missing GW3
      ];

      const result = calculateLuck(entryData, 3);
      
      // Should only process GW1 where both entries have data
      expect(result).toHaveLength(2);
    });
  });

  describe('calculateEffectiveOwnership', () => {
    it('should calculate EO correctly', () => {
      const entryEvents: EntryEvent[] = [
        {
          picks: [
            { element: 1, position: 1, multiplier: 2, is_captain: true, is_vice_captain: false },
            { element: 2, position: 2, multiplier: 1, is_captain: false, is_vice_captain: false },
          ],
        } as EntryEvent,
        {
          picks: [
            { element: 1, position: 1, multiplier: 1, is_captain: false, is_vice_captain: false },
            { element: 3, position: 2, multiplier: 2, is_captain: true, is_vice_captain: false },
          ],
        } as EntryEvent,
      ];

      const result = calculateEffectiveOwnership(entryEvents, {} as Bootstrap);
      
      expect(result.players).toHaveLength(3);
      
      // Player 1: owned by 2/2 = 100%, captained by 1/2 = 50%, EO = 150%
      const player1 = result.players.find(p => p.element_id === 1);
      expect(player1).toMatchObject({
        element_id: 1,
        ownership_percent: 100,
        captaincy_percent: 50,
        effective_ownership: 150,
      });
      
      // Player 2: owned by 1/2 = 50%, not captained = 0%, EO = 50%
      const player2 = result.players.find(p => p.element_id === 2);
      expect(player2).toMatchObject({
        element_id: 2,
        ownership_percent: 50,
        captaincy_percent: 0,
        effective_ownership: 50,
      });
    });

    it('should handle empty entries', () => {
      const result = calculateEffectiveOwnership([], {} as Bootstrap);
      
      expect(result.players).toHaveLength(0);
      expect(result.most_owned_xi).toHaveLength(0);
    });
  });
});
