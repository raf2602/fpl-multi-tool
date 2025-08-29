import { NextRequest, NextResponse } from 'next/server';
import { fetchClassicStandings } from '@/lib/fpl';
import { getErrorMessage } from '@/lib/utils';
import { validators, urlParams } from '@/lib/endpoints';

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  try {
    const leagueId = parseInt(params.leagueId, 10);
    
    if (!validators.leagueId(leagueId)) {
      return NextResponse.json(
        { error: 'Invalid league ID', message: 'League ID must be a positive number' },
        { status: 400 }
      );
    }

    // Get page parameter from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number', message: 'Page must be a positive number' },
        { status: 400 }
      );
    }

    // Add timeout for Netlify compatibility
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000);
    });

    const dataPromise = fetchClassicStandings(leagueId, page);
    
    const data = await Promise.race([dataPromise, timeoutPromise]);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error(`League ${params.leagueId} standings API error:`, error);
    
    let errorMessage = getErrorMessage(error);
    let status = 502;
    
    // Better error handling for Netlify deployment
    if (errorMessage.includes('timeout') || errorMessage.includes('Request timeout')) {
      errorMessage = 'FPL servers are responding slowly. Please try again in a few moments.';
      status = 504; // Gateway Timeout
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      status = 404;
    } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      errorMessage = 'League is private or access denied';
      status = 403;
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch league standings', message: errorMessage },
      { status }
    );
  }
}
