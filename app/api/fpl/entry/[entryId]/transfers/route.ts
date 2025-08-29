import { NextRequest, NextResponse } from 'next/server';
import { fetchEntryTransfers } from '@/lib/fpl';

import { getErrorMessage } from '@/lib/utils';
import { validators } from '@/lib/endpoints';

export async function GET(
  request: NextRequest,
  { params }: { params: { entryId: string } }
) {
  try {
    const entryId = parseInt(params.entryId, 10);
    
    if (!validators.entryId(entryId)) {
      return NextResponse.json(
        { error: 'Invalid entry ID', message: 'Entry ID must be a valid positive number' },
        { status: 400 }
      );
    }

    const data = await fetchEntryTransfers(entryId);
    
    // Medium cache for transfers data as it changes throughout the season
    const cacheTime = 600;
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 3}`,
      },
    });
  } catch (error) {
    console.error(`Entry ${params.entryId} transfers API error:`, error);
    
    const errorMessage = getErrorMessage(error);
    let status = 502;
    
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      status = 401;
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      status = 404;
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch entry transfers', 
        message: errorMessage,
        requiresAuth: status === 401,
      },
      { status }
    );
  }
}
