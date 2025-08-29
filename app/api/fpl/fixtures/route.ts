import { NextResponse } from 'next/server';
import { fetchFixtures } from '@/lib/fpl';
import { getErrorMessage } from '@/lib/utils';

export async function GET() {
  try {
    const data = await fetchFixtures();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Fixtures API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch fixtures data', message: getErrorMessage(error) },
      { status: 502 }
    );
  }
}
