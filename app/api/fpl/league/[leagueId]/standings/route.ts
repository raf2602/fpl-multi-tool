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

    const data = await fetchClassicStandings(leagueId, page);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error(`League ${params.leagueId} standings API error:`, error);
    
    const errorMessage = getErrorMessage(error);
    const status = errorMessage.includes('404') || errorMessage.includes('not found') ? 404 : 502;
    
    return NextResponse.json(
      { error: 'Failed to fetch league standings', message: errorMessage },
      { status }
    );
  }
}
