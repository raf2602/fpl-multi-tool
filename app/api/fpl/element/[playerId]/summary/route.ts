import { NextRequest, NextResponse } from 'next/server';
import { fetchElementSummary } from '@/lib/fpl';
import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/endpoints';

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const playerId = parseInt(params.playerId, 10);
    
    if (!validators.playerId(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID', message: 'Player ID must be a positive number' },
        { status: 400 }
      );
    }

    const data = await fetchElementSummary(playerId);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error(`Element ${params.playerId} summary API error:`, error);
    
    const errorMessage = getErrorMessage(error);
    const status = errorMessage.includes('404') || errorMessage.includes('not found') ? 404 : 502;
    
    return NextResponse.json(
      { error: 'Failed to fetch player summary', message: errorMessage },
      { status }
    );
  }
}
