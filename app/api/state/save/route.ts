import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/utils';

const stateSchema = z.object({
  leagueId: z.number().positive().optional(),
  entryIds: z.array(z.number().positive()).optional(),
  settings: z.record(z.any()).optional(),
});

// Simple in-memory store for this session
// In production, this could be Redis or a database
const stateStore = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = stateSchema.parse(body);

    // Generate a simple session key (in production, use proper session management)
    const sessionKey = request.headers.get('x-session-id') || 'default';
    
    // Store the state
    stateStore.set(sessionKey, {
      ...state,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: 'State saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Save state API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          message: error.errors[0]?.message || 'Invalid request data' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save state', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionKey = request.headers.get('x-session-id') || 'default';
    const state = stateStore.get(sessionKey) || {};

    return NextResponse.json(state, { status: 200 });
  } catch (error) {
    console.error('Load state API error:', error);

    return NextResponse.json(
      { error: 'Failed to load state', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
