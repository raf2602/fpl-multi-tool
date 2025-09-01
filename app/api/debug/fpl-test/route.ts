import { NextRequest, NextResponse } from 'next/server';
import { formatLeagueType } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId') || '314'; // Default to overall league
    
    const url = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/?page_standings=1`;
    
    console.log(`Testing FPL API: ${url}`);
    
    // Test with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000);
    });

    const fetchPromise = fetch(url, {
      headers: {
        'User-Agent': 'FPL-WebApp/1.0',
      },
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        url,
        message: `FPL API returned ${response.status}: ${response.statusText}`,
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      url,
      leagueName: data.league?.name || 'Unknown',
      leagueType: data.league?.league_type ? formatLeagueType(data.league.league_type) : 'Unknown',
      privacy: data.league?.code_privacy === 'p' ? 'Private' : 'Public',
      memberCount: data.standings?.results?.length || 0,
      data: data,
    });

  } catch (error) {
    console.error('FPL API test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test FPL API connectivity',
    }, { status: 500 });
  }
}
