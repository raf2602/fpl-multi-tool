import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { SessionData } from './types';

// Session store interface
interface SessionStore {
  set(token: string, data: SessionData): Promise<void>;
  get(token: string): Promise<SessionData | null>;
  delete(token: string): Promise<void>;
  touch(token: string): Promise<void>;
}

// In-memory session store for development
class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionData>();
  private timers = new Map<string, NodeJS.Timeout>();

  async set(token: string, data: SessionData): Promise<void> {
    this.sessions.set(token, data);
    this.setExpiration(token, data.expiresAt);
  }

  async get(token: string): Promise<SessionData | null> {
    const session = this.sessions.get(token);
    if (!session) return null;

    const now = Date.now();
    if (now > session.expiresAt) {
      await this.delete(token);
      return null;
    }

    return session;
  }

  async delete(token: string): Promise<void> {
    this.sessions.delete(token);
    const timer = this.timers.get(token);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(token);
    }
  }

  async touch(token: string): Promise<void> {
    const session = await this.get(token);
    if (!session) return;

    const newExpiresAt = Date.now() + getSessionTTL();
    const updatedSession = { ...session, expiresAt: newExpiresAt };
    await this.set(token, updatedSession);
  }

  private setExpiration(token: string, expiresAt: number): void {
    const timer = this.timers.get(token);
    if (timer) {
      clearTimeout(timer);
    }

    const delay = expiresAt - Date.now();
    if (delay > 0) {
      const newTimer = setTimeout(() => {
        this.delete(token).catch(console.error);
      }, delay);
      this.timers.set(token, newTimer);
    }
  }

  // Utility methods for debugging
  size(): number {
    return this.sessions.size;
  }

  clear(): void {
    this.sessions.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

// Redis session store (optional)
class RedisSessionStore implements SessionStore {
  private redis: any; // Would be Redis client

  constructor(redisUrl: string) {
    // Initialize Redis client here
    // This is a placeholder - in a real implementation you'd use ioredis or similar
    console.log('Redis session store initialized with URL:', redisUrl);
  }

  async set(token: string, data: SessionData): Promise<void> {
    const ttlSeconds = Math.floor((data.expiresAt - Date.now()) / 1000);
    if (ttlSeconds > 0) {
      // await this.redis.setex(`session:${token}`, ttlSeconds, JSON.stringify(data));
    }
  }

  async get(token: string): Promise<SessionData | null> {
    // const data = await this.redis.get(`session:${token}`);
    // return data ? JSON.parse(data) : null;
    return null; // Placeholder
  }

  async delete(token: string): Promise<void> {
    // await this.redis.del(`session:${token}`);
  }

  async touch(token: string): Promise<void> {
    const session = await this.get(token);
    if (session) {
      const newExpiresAt = Date.now() + getSessionTTL();
      await this.set(token, { ...session, expiresAt: newExpiresAt });
    }
  }
}

// Session store singleton
let sessionStore: SessionStore;

function getSessionStore(): SessionStore {
  if (!sessionStore) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      sessionStore = new RedisSessionStore(redisUrl);
    } else {
      sessionStore = new MemorySessionStore();
    }
  }
  return sessionStore;
}

// Configuration
const SESSION_COOKIE_NAME = 'sid';
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

function getSessionTTL(): number {
  return SESSION_TTL;
}

function generateSessionToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Core session management functions
export async function createSession(data: SessionData): Promise<string> {
  const token = generateSessionToken();
  const store = getSessionStore();
  
  const sessionData: SessionData = {
    ...data,
    expiresAt: Date.now() + getSessionTTL(),
  };
  
  await store.set(token, sessionData);
  return token;
}

export async function getSession(token: string): Promise<SessionData | null> {
  if (!token) return null;
  
  const store = getSessionStore();
  return await store.get(token);
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return;
  
  const store = getSessionStore();
  await store.delete(token);
}

export async function touchSession(token: string): Promise<void> {
  if (!token) return;
  
  const store = getSessionStore();
  await store.touch(token);
}

// Cookie management helpers
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(getSessionTTL() / 1000), // Convert to seconds
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

export function getSessionToken(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

export function getSessionTokenFromHeaders(): string | null {
  try {
    const cookieStore = cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

// Authentication context for API routes
export interface AuthContext {
  session: SessionData | null;
  isAuthenticated: boolean;
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const token = getSessionToken(request);
  
  if (!token) {
    return { session: null, isAuthenticated: false };
  }
  
  const session = await getSession(token);
  
  if (!session) {
    return { session: null, isAuthenticated: false };
  }
  
  // Touch session to extend TTL
  await touchSession(token);
  
  return { session, isAuthenticated: true };
}

export async function getAuthContextFromHeaders(): Promise<AuthContext> {
  const token = getSessionTokenFromHeaders();
  
  if (!token) {
    return { session: null, isAuthenticated: false };
  }
  
  const session = await getSession(token);
  
  if (!session) {
    return { session: null, isAuthenticated: false };
  }
  
  // Touch session to extend TTL
  await touchSession(token);
  
  return { session, isAuthenticated: true };
}

// Middleware for protected routes
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const context = await getAuthContext(request);
  
  if (!context.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return context;
}

// Cookie parsing utilities
export function parseFplCookies(rawCookie: string): { sessionid?: string; pl_profile?: string } {
  const cookies: Record<string, string> = {};
  
  // Split by semicolon and parse each cookie
  rawCookie.split(';').forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name && valueParts.length > 0) {
      cookies[name] = valueParts.join('=');
    }
  });
  
  return {
    sessionid: cookies.sessionid,
    pl_profile: cookies.pl_profile,
  };
}

export function validateFplCookies(rawCookie: string): boolean {
  const { sessionid } = parseFplCookies(rawCookie);
  
  // Check if sessionid exists and looks valid
  if (!sessionid) return false;
  
  // Basic validation - sessionid should be alphanumeric and reasonable length
  if (!/^[a-zA-Z0-9]{20,}$/.test(sessionid)) return false;
  
  return true;
}

export function formatFplCookies(cookies: { sessionid?: string; pl_profile?: string }): string {
  const cookieParts: string[] = [];
  
  if (cookies.sessionid) {
    cookieParts.push(`sessionid=${cookies.sessionid}`);
  }
  
  if (cookies.pl_profile) {
    cookieParts.push(`pl_profile=${cookies.pl_profile}`);
  }
  
  return cookieParts.join('; ');
}

// Login form utilities
export interface LoginCredentials {
  email: string;
  password: string;
}

export function validateLoginCredentials(credentials: LoginCredentials): string[] {
  const errors: string[] = [];
  
  if (!credentials.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    errors.push('Email format is invalid');
  }
  
  if (!credentials.password) {
    errors.push('Password is required');
  } else if (credentials.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return errors;
}

// FPL login endpoint
export async function loginToFpl(credentials: LoginCredentials): Promise<string> {
  const response = await fetch('https://users.premierleague.com/accounts/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'FPL-WebApp/1.0',
    },
    body: new URLSearchParams({
      login: credentials.email,
      password: credentials.password,
      redirect_uri: 'https://fantasy.premierleague.com/',
      app: 'plfpl-web',
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('FPL login failed:', response.status, errorText);
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid email or password');
    }
    
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  // Extract cookies from response
  const setCookieHeaders = response.headers.getSetCookie();
  const cookies: Record<string, string> = {};
  
  setCookieHeaders.forEach(header => {
    const [cookiePart] = header.split(';');
    const [name, value] = cookiePart.split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  
  // Format cookies for storage
  return formatFplCookies({
    sessionid: cookies.sessionid,
    pl_profile: cookies.pl_profile,
  });
}

// Session cleanup utilities
export async function cleanupExpiredSessions(): Promise<void> {
  // This would be more relevant for Redis implementation
  // For memory store, cleanup happens automatically via timeouts
  console.log('Session cleanup completed');
}

// Development utilities
export function getSessionStats(): any {
  const store = getSessionStore();
  if (store instanceof MemorySessionStore) {
    return {
      type: 'memory',
      size: store.size(),
      ttl: getSessionTTL(),
    };
  }
  
  return {
    type: 'redis',
    ttl: getSessionTTL(),
  };
}
