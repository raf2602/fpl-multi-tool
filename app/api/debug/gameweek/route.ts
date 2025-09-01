import { NextResponse } from 'next/server';
import { fetchBootstrap } from '@/lib/fpl';

export async function GET() {
  try {
    const data = await fetchBootstrap();
    
    const currentEvent = data.events.find(event => event.is_current);
    const nextEvent = data.events.find(event => event.is_next);
    
    return NextResponse.json({
      success: true,
      currentGameweek: currentEvent?.id || 'Not found',
      currentGameweekName: currentEvent?.name || 'Not found',
      currentGameweekFinished: currentEvent?.finished || false,
      currentGameweekDataChecked: currentEvent?.data_checked || false,
      nextGameweek: nextEvent?.id || 'Not found',
      nextGameweekName: nextEvent?.name || 'Not found',
      allEvents: data.events.map(event => ({
        id: event.id,
        name: event.name,
        is_current: event.is_current,
        is_next: event.is_next,
        finished: event.finished,
        data_checked: event.data_checked,
      })),
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Gameweek debug API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch gameweek data',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
