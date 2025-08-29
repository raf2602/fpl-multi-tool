import { NextRequest, NextResponse } from 'next/server';
import { fetchEntryHistory } from '@/lib/fpl';
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

    const data = await fetchEntryHistory(entryId);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error(`Entry ${params.entryId} history API error:`, error);
    
    const errorMessage = getErrorMessage(error);
    let status = 502;
    
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      status = 401;
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      status = 404;
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch entry history', 
        message: errorMessage,
        requiresAuth: status === 401,
      },
      { status }
    );
  }
}
