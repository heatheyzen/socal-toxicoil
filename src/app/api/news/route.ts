import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NewsItem } from '@/lib/types';

// Node.js runtime — rss-parser requires Node APIs
const parser = new Parser({
  timeout: 8000,
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
    ],
  },
});

const RSS_URL =
  'https://news.google.com/rss/search?q=oil+spill+OR+%22oil+leak%22+%22Los+Angeles%22+OR+%22Ventura%22+OR+%22Orange+County%22&hl=en-US&gl=US&ceid=US:en';

const OIL_KEYWORDS = [
  'oil spill', 'oil leak', 'petroleum spill', 'fuel spill',
  'crude oil', 'pipeline leak', 'oil slick', 'oil discharge',
  'chemical spill', 'oil contamination',
];

// Sorted longest-first so "wilmington marina" matches before "wilmington", etc.
const GEOCODE: [string, { lat: number; lng: number }][] = ([
  // === Specific sub-locations (match before general city names) ===
  // LA — ports, marinas, industrial waterways
  ['los angeles harbor',             { lat: 33.7283, lng: -118.2747 }],
  ['long beach harbor',              { lat: 33.7523, lng: -118.2165 }],
  ['wilmington marina',              { lat: 33.7700, lng: -118.2637 }],
  ['cabrillo marina',                { lat: 33.7215, lng: -118.2773 }],
  ['cabrillo beach',                 { lat: 33.7200, lng: -118.2769 }],
  ['terminal island',                { lat: 33.7455, lng: -118.2554 }],
  ['dominguez channel',              { lat: 33.8200, lng: -118.2500 }],
  ['los cerritos wetlands',          { lat: 33.7814, lng: -118.1106 }],
  ['ballona wetlands',               { lat: 33.9750, lng: -118.4200 }],
  ['ballona creek',                  { lat: 33.9767, lng: -118.4442 }],
  ['machado lake',                   { lat: 33.7931, lng: -118.2653 }],
  ['alamitos bay',                   { lat: 33.7514, lng: -118.1167 }],
  ['belmont shore',                  { lat: 33.7611, lng: -118.1356 }],
  ['king harbor',                    { lat: 33.8436, lng: -118.3987 }],
  ['dockweiler beach',               { lat: 33.9436, lng: -118.4469 }],
  ['inglewood oil field',            { lat: 33.9964, lng: -118.3752 }],
  ['torrance refinery',              { lat: 33.8347, lng: -118.3347 }],
  // LA — beaches (Malibu/north)
  ['leo carrillo',                   { lat: 34.0450, lng: -118.9347 }],
  ['el matador beach',               { lat: 34.0365, lng: -118.8809 }],
  ['zuma beach',                     { lat: 34.0155, lng: -118.8225 }],
  ['point dume',                     { lat: 34.0003, lng: -118.8081 }],
  ['surfrider beach',                { lat: 34.0378, lng: -118.6761 }],
  ['will rogers beach',              { lat: 34.0228, lng: -118.5378 }],
  // Ventura — harbors, beaches, islands
  ['santa barbara channel',          { lat: 34.10,   lng: -119.70   }],
  ['channel islands harbor',         { lat: 34.1597, lng: -119.2183 }],
  ['channel islands',                { lat: 34.0069, lng: -119.7785 }],
  ['santa cruz island',              { lat: 34.0567, lng: -119.7203 }],
  ['anacapa island',                 { lat: 34.0108, lng: -119.3631 }],
  ['ventura harbor',                 { lat: 34.2406, lng: -119.2721 }],
  ['hueneme bay',                    { lat: 34.1478, lng: -119.2017 }],
  ['rincon beach',                   { lat: 34.3619, lng: -119.4742 }],
  ['emma wood',                      { lat: 34.2883, lng: -119.3275 }],
  // OC — wetlands, harbors, beaches
  ['bolsa chica ecological reserve', { lat: 33.7283, lng: -118.0597 }],
  ['bolsa chica wetlands',           { lat: 33.7283, lng: -118.0597 }],
  ['huntington harbor',              { lat: 33.7208, lng: -118.0750 }],
  ['bolsa chica',                    { lat: 33.7283, lng: -118.0597 }],
  ['upper newport bay',              { lat: 33.6408, lng: -117.8997 }],
  ['balboa peninsula',               { lat: 33.6011, lng: -117.9042 }],
  ['newport harbor',                 { lat: 33.6036, lng: -117.9056 }],
  ['dana point harbor',              { lat: 33.4628, lng: -117.6986 }],
  ['doheny beach',                   { lat: 33.4728, lng: -117.6833 }],
  ['crystal cove',                   { lat: 33.5705, lng: -117.8361 }],
  ['talbert marsh',                  { lat: 33.6469, lng: -117.9817 }],
  ['santa ana river',                { lat: 33.6347, lng: -117.9600 }],
  ['aliso creek',                    { lat: 33.5214, lng: -117.7556 }],
  // === General city / area names ===
  // LA County
  ['port of los angeles',    { lat: 33.7283, lng: -118.2747 }],
  ['port of long beach',     { lat: 33.7523, lng: -118.2165 }],
  ['rancho palos verdes',    { lat: 33.7445, lng: -118.3870 }],
  ['marina del rey',         { lat: 33.9800, lng: -118.4517 }],
  ['santa monica',           { lat: 34.0195, lng: -118.4912 }],
  ['manhattan beach',        { lat: 33.8847, lng: -118.4109 }],
  ['hermosa beach',          { lat: 33.8622, lng: -118.3995 }],
  ['redondo beach',          { lat: 33.8492, lng: -118.3884 }],
  ['playa del rey',          { lat: 33.9586, lng: -118.4456 }],
  ['north hollywood',        { lat: 34.1872, lng: -118.3830 }],
  ['palos verdes',           { lat: 33.7445, lng: -118.4043 }],
  ['woodland hills',         { lat: 34.1683, lng: -118.6058 }],
  ['agoura hills',           { lat: 34.1536, lng: -118.7606 }],
  ['sherman oaks',           { lat: 34.1503, lng: -118.4489 }],
  ['santa fe springs',       { lat: 33.9428, lng: -118.0592 }],
  ['signal hill',            { lat: 33.8042, lng: -118.1684 }],
  ['rolling hills',          { lat: 33.7595, lng: -118.3554 }],
  ['culver city',            { lat: 34.0211, lng: -118.3965 }],
  ['studio city',            { lat: 34.1392, lng: -118.3878 }],
  ['long beach',             { lat: 33.7701, lng: -118.1937 }],
  ['los angeles',            { lat: 34.0522, lng: -118.2437 }],
  ['san pedro',              { lat: 33.7361, lng: -118.2922 }],
  ['el segundo',             { lat: 33.9164, lng: -118.4165 }],
  ['wilmington',             { lat: 33.7792, lng: -118.2673 }],
  ['torrance',               { lat: 33.8358, lng: -118.3406 }],
  ['inglewood',              { lat: 33.9617, lng: -118.3531 }],
  ['hawthorne',              { lat: 33.9164, lng: -118.3525 }],
  ['gardena',                { lat: 33.8883, lng: -118.3089 }],
  ['compton',                { lat: 33.8958, lng: -118.2201 }],
  ['lakewood',               { lat: 33.8536, lng: -118.1340 }],
  ['carson',                 { lat: 33.8317, lng: -118.2820 }],
  ['malibu',                 { lat: 34.0259, lng: -118.7798 }],
  ['burbank',                { lat: 34.1808, lng: -118.3090 }],
  ['glendale',               { lat: 34.1425, lng: -118.2551 }],
  ['pasadena',               { lat: 34.1478, lng: -118.1445 }],
  ['calabasas',              { lat: 34.1358, lng: -118.6601 }],
  ['bellflower',             { lat: 33.8881, lng: -118.1170 }],
  ['paramount',              { lat: 33.8894, lng: -118.1597 }],
  ['norwalk',                { lat: 33.9022, lng: -118.0817 }],
  ['downey',                 { lat: 33.9401, lng: -118.1326 }],
  ['cerritos',               { lat: 33.8584, lng: -118.0650 }],
  ['whittier',               { lat: 33.9792, lng: -118.0328 }],
  ['pomona',                 { lat: 34.0553, lng: -117.7490 }],
  ['venice',                 { lat: 33.9850, lng: -118.4695 }],
  // Ventura County
  ['ventura county',         { lat: 34.2746, lng: -119.2290 }],
  ['thousand oaks',          { lat: 34.1706, lng: -118.8376 }],
  ['port hueneme',           { lat: 34.1478, lng: -119.1951 }],
  ['santa paula',            { lat: 34.3541, lng: -119.0590 }],
  ['simi valley',            { lat: 34.2694, lng: -118.7815 }],
  ['camarillo',              { lat: 34.2164, lng: -119.0376 }],
  ['point mugu',             { lat: 34.1153, lng: -119.1142 }],
  ['moorpark',               { lat: 34.2856, lng: -118.8820 }],
  ['fillmore',               { lat: 34.3992, lng: -118.9176 }],
  ['ventura',                { lat: 34.2746, lng: -119.2290 }],
  ['oxnard',                 { lat: 34.1975, lng: -119.1771 }],
  ['ojai',                   { lat: 34.4480, lng: -119.2429 }],
  // Orange County
  ['orange county',          { lat: 33.7455, lng: -117.8677 }],
  ['huntington beach',       { lat: 33.6595, lng: -117.9988 }],
  ['laguna niguel',          { lat: 33.5225, lng: -117.7081 }],
  ['laguna hills',           { lat: 33.5964, lng: -117.7117 }],
  ['laguna beach',           { lat: 33.5422, lng: -117.7831 }],
  ['laguna woods',           { lat: 33.6097, lng: -117.7225 }],
  ['aliso viejo',            { lat: 33.5765, lng: -117.7253 }],
  ['mission viejo',          { lat: 33.6000, lng: -117.6719 }],
  ['newport beach',          { lat: 33.6189, lng: -117.9289 }],
  ['dana point',             { lat: 33.4669, lng: -117.6981 }],
  ['san clemente',           { lat: 33.4270, lng: -117.6120 }],
  ['seal beach',             { lat: 33.7414, lng: -118.1047 }],
  ['costa mesa',             { lat: 33.6411, lng: -117.9187 }],
  ['santa ana',              { lat: 33.7455, lng: -117.8677 }],
  ['garden grove',           { lat: 33.7743, lng: -117.9378 }],
  ['buena park',             { lat: 33.8675, lng: -117.9981 }],
  ['westminster',            { lat: 33.7514, lng: -117.9940 }],
  ['lake forest',            { lat: 33.6469, lng: -117.6892 }],
  ['fountain valley',        { lat: 33.7092, lng: -117.9536 }],
  ['yorba linda',            { lat: 33.8886, lng: -117.8131 }],
  ['los alamitos',           { lat: 33.8025, lng: -118.0731 }],
  ['la habra',               { lat: 33.9319, lng: -117.9462 }],
  ['fullerton',              { lat: 33.8704, lng: -117.9242 }],
  ['placentia',              { lat: 33.8725, lng: -117.8703 }],
  ['anaheim',                { lat: 33.8353, lng: -117.9145 }],
  ['cypress',                { lat: 33.8170, lng: -118.0373 }],
  ['irvine',                 { lat: 33.6846, lng: -117.8265 }],
  ['tustin',                 { lat: 33.7458, lng: -117.8261 }],
  ['brea',                   { lat: 33.9167, lng: -117.9003 }],
  ['orange',                 { lat: 33.7879, lng: -117.8531 }],
  // Regional fallbacks
  ['southern california',    { lat: 33.90,   lng: -118.20   }],
  ['south coast',            { lat: 33.80,   lng: -118.20   }],
  ['socal',                  { lat: 33.90,   lng: -118.20   }],
] as [string, { lat: number; lng: number }][]).sort((a, b) => b[0].length - a[0].length);

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function geocode(text: string): { lat: number; lng: number } | null {
  const lower = text.toLowerCase();
  for (const [place, coords] of GEOCODE) {
    if (lower.includes(place)) return coords;
  }
  return null;
}

function isOilRelated(title: string, desc: string): boolean {
  const text = (title + ' ' + desc).toLowerCase();
  return OIL_KEYWORDS.some(kw => text.includes(kw));
}

// Extract image URL directly from RSS entry media fields or content HTML
function extractEntryImage(entry: Record<string, unknown>): string | null {
  type MediaObj = { $?: { url?: string }; url?: string } | string;
  const tryUrl = (m: unknown): string | null => {
    if (!m) return null;
    if (typeof m === 'string' && m.startsWith('http')) return m;
    if (typeof m === 'object') {
      const o = m as MediaObj;
      const u = (o as { $?: { url?: string } }).$?.url ?? (o as { url?: string }).url;
      if (u?.startsWith('http')) return u;
    }
    return null;
  };
  const fromMedia = tryUrl(entry['media:content']) ?? tryUrl(entry['media:thumbnail']);
  if (fromMedia) return fromMedia;
  const enc = entry['enclosure'] as { url?: string } | undefined;
  if (enc?.url?.startsWith('http')) return enc.url;
  const content = entry['content'] as string | undefined;
  if (content) {
    const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m?.[1]?.startsWith('http')) return m[1];
  }
  return null;
}

async function tryFetchOgImage(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
      },
    });
    clearTimeout(timer);
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let html = '';
    try {
      while (html.length < 32000) {
        const { value, done } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (html.toLowerCase().includes('</head>')) break;
      }
    } finally {
      reader.cancel().catch(() => {});
    }
    const m =
      html.match(/property=["']og:image["'][^>]*content=["']([^"']{10,})["']/i) ??
      html.match(/content=["']([^"']{10,})["'][^>]*property=["']og:image["']/i) ??
      html.match(/name=["']twitter:image["'][^>]*content=["']([^"']{10,})["']/i) ??
      html.match(/content=["']([^"']{10,})["'][^>]*name=["']twitter:image["']/i);
    if (!m?.[1]) return null;
    const img = m[1];
    if (img.includes('lh3.googleusercontent.com')) {
      return img.replace(/=s0-w\d+(-[a-z]+)*$/, '=s0-w640');
    }
    return img.startsWith('http') ? img : null;
  } catch {
    return null;
  }
}

// Fetch og:image for a news article.
// Tries the Google News article page first (/articles/ not /rss/articles/) which
// has Google-cached thumbnails in server-rendered HTML, then falls back to the
// publisher URL (which often blocks scrapers).
async function fetchNewsImage(link: string): Promise<string | null> {
  const urls: string[] = [];
  if (link.includes('news.google.com/rss/articles/')) {
    urls.push(link.replace('news.google.com/rss/articles/', 'news.google.com/articles/'));
  }
  urls.push(link);
  for (const url of urls) {
    const img = await tryFetchOgImage(url);
    if (img) return img;
  }
  return null;
}

export async function GET() {
  try {
    const feed = await parser.parseURL(RSS_URL);
    const candidates: NewsItem[] = [];

    for (const entry of feed.items) {
      const rawTitle = entry.title ?? '';
      // Google News titles: "Headline - Publisher Name" — split on last " - "
      const dashIdx = rawTitle.lastIndexOf(' - ');
      const title  = dashIdx > 15 ? rawTitle.slice(0, dashIdx) : rawTitle;
      const source = dashIdx > 15 ? rawTitle.slice(dashIdx + 3).trim() : 'Google News';

      const rawDesc = entry.contentSnippet ?? (entry as unknown as Record<string, string>)['content'] ?? '';
      const fullText = stripHtml(rawDesc);
      const description = fullText.slice(0, 300);

      if (!isOilRelated(title, description)) continue;

      const geo = geocode(title + ' ' + fullText);
      if (!geo) continue;

      // Try to get image directly from RSS entry before falling back to page fetch
      const directImage = extractEntryImage(entry as unknown as Record<string, unknown>);

      candidates.push({
        title,
        link: entry.link ?? '',
        pubDate: entry.pubDate ?? entry.isoDate ?? '',
        source,
        description,
        fullDescription: fullText || undefined,
        lat: geo.lat,
        lng: geo.lng,
        imageUrl: directImage ?? undefined,
      });

      if (candidates.length >= 9) break;
    }

    // For candidates without a direct RSS image, fetch from the article page
    const fetchQueue = candidates
      .map((c, i) => ({ i, link: c.link, hasImage: !!c.imageUrl }))
      .filter(x => !x.hasImage);

    const fetchResults = await Promise.allSettled(
      fetchQueue.map(x => fetchNewsImage(x.link))
    );

    const items: NewsItem[] = candidates.map((c, i) => {
      if (c.imageUrl) return c;
      const qIdx = fetchQueue.findIndex(x => x.i === i);
      if (qIdx === -1) return c;
      const r = fetchResults[qIdx];
      return {
        ...c,
        imageUrl: r.status === 'fulfilled' ? (r.value ?? undefined) : undefined,
      };
    });

    return NextResponse.json({ items }, {
      headers: { 'Cache-Control': 'public, max-age=90, stale-while-revalidate=60' },
    });
  } catch (err) {
    return NextResponse.json({ items: [], error: String(err) }, { status: 200 });
  }
}
