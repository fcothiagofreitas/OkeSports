import { NextRequest, NextResponse } from 'next/server';
import { syncFcatRoadRaces } from '@/lib/external-events/sync';

function parseYears(rawYears: string | null): number[] | undefined {
  if (!rawYears) return undefined;

  const years = rawYears
    .split(',')
    .map((year) => Number(year.trim()))
    .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100);

  return years.length > 0 ? years : undefined;
}

function isAuthorized(request: NextRequest) {
  const token = process.env.EXTERNAL_EVENTS_SYNC_TOKEN;
  if (!token) return process.env.NODE_ENV !== 'production';

  const header = request.headers.get('authorization');
  if (!header) return false;

  const [, value] = header.split(' ');
  return value === token;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const years = parseYears(searchParams.get('years'));

    const result = await syncFcatRoadRaces(years);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('External events sync failed:', error);
    return NextResponse.json({ error: 'Failed to sync external events' }, { status: 500 });
  }
}
