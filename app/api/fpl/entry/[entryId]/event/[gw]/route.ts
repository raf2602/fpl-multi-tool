import { NextRequest, NextResponse } from 'next/server';
import { fetchEntryEvent } from '@/lib/fpl';

import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/endpoints';

export async function GET(
  request: NextRequest,
  { params }: { params: { entryId: string; gw: string } }
) {
  try {
    const entryId = parseInt(params.entryId, 10);
    const gw = parseInt(params.gw, 10);
    
    if (!validators.entryId(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID', message: 'Entry ID must be a valid positive number' },
        { status: 400 }
      );
    }
    
    if (!validators.gameweek(gw)) {
      return NextResponse.json(
        { error: 'Invalid gameweek', message: 'Gameweek must be between 1 and 38' },
        { status: 400 }
      );
    }

    const data = await fetchEntryEvent(entryId, gw);
    
    // Short cache for current gameweek data, longer for past gameweeks
    const cacheTime = 600;
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 5}`,
      },
    });
  } catch (error) {
    console.error(`Entry ${params.entryId} GW ${params.gw} API error:`, error);
    
    const errorMessage = getErrorMessage(error);
    let status = 502;
    
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      status = 401;
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      status = 404;
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch entry gameweek data', 
        message: errorMessage,
        requiresAuth: status === 401,
      },
      { status }
    );
  }
}
