import { NextResponse } from 'next/server';
// TODO Milestone Step 6: Parse NEWS_RSS_URLS env var, fetch each RSS feed,
// merge results sorted by date, return top 9 as JSON NewsItem[].
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    items: [],
    message: 'News feed — implement in Milestone Step 6',
  });
}
