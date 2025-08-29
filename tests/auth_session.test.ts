import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createSession, 
  getSession, 
  destroySession, 
  validateFplCookies,
  parseFplCookies,
  formatFplCookies
} from '@/lib/auth';
import type { SessionData } from '@/lib/types';

describe('Auth Session Management', () => {
  beforeEach(() => {
    // Clear any existing sessions
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should create and retrieve a session', async () => {
      const sessionData: SessionData = {
        cookies: 'sessionid=test123; pl_profile=profile123',
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };

      const token = await createSession(sessionData);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      const retrievedSession = await getSession(token);
      expect(retrievedSession).toMatchObject({
        cookies: sessionData.cookies,
        expiresAt: expect.any(Number),
      });
    });

    it('should return null for non-existent session', async () => {
      const result = await getSession('non-existent-token');
      expect(result).toBeNull();
    });

    it('should destroy a session', async () => {
      const sessionData: SessionData = {
        cookies: 'sessionid=test123',
        expiresAt: Date.now() + 3600000,
      };

      const token = await createSession(sessionData);
      await destroySession(token);

      const retrievedSession = await getSession(token);
      expect(retrievedSession).toBeNull();
    });

    it('should handle expired sessions', async () => {
      const sessionData: SessionData = {
        cookies: 'sessionid=test123',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const token = await createSession(sessionData);
      const retrievedSession = await getSession(token);
      
      // Should return null for expired session
      expect(retrievedSession).toBeNull();
    });
  });

  describe('FPL Cookie Validation', () => {
    it('should validate correct FPL cookies', () => {
      const validCookies = [
        'sessionid=abcd1234efgh5678',
        'sessionid=test123; pl_profile=profile456',
        'pl_profile=xyz789; sessionid=valid123; other=value',
      ];

      validCookies.forEach(cookie => {
        expect(validateFplCookies(cookie)).toBe(true);
      });
    });

    it('should reject invalid FPL cookies', () => {
      const invalidCookies = [
        '', // Empty
        'other=value', // No sessionid
        'sessionid=', // Empty sessionid
        'sessionid=ab', // Too short
        'sessionid=invalid-chars!@#', // Invalid characters
      ];

      invalidCookies.forEach(cookie => {
        expect(validateFplCookies(cookie)).toBe(false);
      });
    });
  });

  describe('Cookie Parsing', () => {
    it('should parse FPL cookies correctly', () => {
      const cookieString = 'sessionid=test123; pl_profile=profile456; other=value';
      const result = parseFplCookies(cookieString);

      expect(result).toEqual({
        sessionid: 'test123',
        pl_profile: 'profile456',
      });
    });

    it('should handle missing cookies', () => {
      const cookieString = 'other=value; more=data';
      const result = parseFplCookies(cookieString);

      expect(result).toEqual({
        sessionid: undefined,
        pl_profile: undefined,
      });
    });

    it('should handle malformed cookie strings', () => {
      const cookieString = 'sessionid=test123;=empty;invalid';
      const result = parseFplCookies(cookieString);

      expect(result.sessionid).toBe('test123');
    });
  });

  describe('Cookie Formatting', () => {
    it('should format cookies correctly', () => {
      const cookies = {
        sessionid: 'test123',
        pl_profile: 'profile456',
      };

      const result = formatFplCookies(cookies);
      expect(result).toBe('sessionid=test123; pl_profile=profile456');
    });

    it('should handle missing cookies', () => {
      const cookies = {
        sessionid: 'test123',
      };

      const result = formatFplCookies(cookies);
      expect(result).toBe('sessionid=test123');
    });

    it('should handle empty cookies', () => {
      const cookies = {};
      const result = formatFplCookies(cookies);
      expect(result).toBe('');
    });
  });
});
