import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveGw } from '@/lib/fpl';
import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/endpoints';

export async function GET(
  request: NextRequest,
  { params }: { params: { gw: string } }
) {
  try {
    const gw = parseInt(params.gw, 10);
    
    if (!validators.gameweek(gw)) {
      return NextResponse.json(
        { error: 'Invalid gameweek number', message: 'Gameweek must be between 1 and 38' },
        { status: 400 }
      );
    }

    const data = await fetchLiveGw(gw);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error(`Live GW ${params.gw} API error:`, error);
    
    return NextResponse.json(
      { error: 'Failed to fetch live gameweek data', message: getErrorMessage(error) },
      { status: 502 }
    );
  }
}
