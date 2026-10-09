import { NextRequest, NextResponse } from 'next/server';
import stringSimilarity from 'string-similarity';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function scoreMatch(query: { artist: string; title: string }, candidate: any) {
    const artistSim = stringSimilarity.compareTwoStrings(
        query.artist.toLowerCase().trim(),
        (candidate.artist_name || '').toLowerCase().trim()
    );
    const titleSim = stringSimilarity.compareTwoStrings(
        query.title.toLowerCase().trim(),
        (candidate.name || '').toLowerCase().trim()
    );
    return (artistSim * 0.4) + (titleSim * 0.6);
}

export async function POST(req: NextRequest) {
    const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
    if (!JAMENDO_CLIENT_ID) {
        return NextResponse.json({ found: false, error: 'Jamendo not configured' }, { status: 500 });
    }

    const { artist, title } = await req.json().catch(() => ({}));
    if (!title && !artist) {
        return NextResponse.json({ found: false, error: 'No query' }, { status: 400 });
    }

    const query = [artist, title].filter(Boolean).join(' ').trim();

    const url = new URL('https://api.jamendo.com/v3.0/tracks/');
    url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '15'); 
    url.searchParams.set('search', query);
    url.searchParams.set('audioformat', 'mp32');
    url.searchParams.set('include', 'musicinfo+licenses');

    try {
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) {
            return NextResponse.json({ found: false, error: `Jamendo ${res.status}` });
        }

        const data = await res.json();
        const results: any[] = data.results ?? [];

        if (results.length === 0) {
            return NextResponse.json({ found: false });
        }

        let bestMatch: any = null;
        let bestScore = 0;

        for (const track of results) {
            const score = scoreMatch({ artist, title }, track);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = track;
            }
        }

        const SIMILARITY_THRESHOLD = 0.7; 
        if (!bestMatch || bestScore < SIMILARITY_THRESHOLD) {
            return NextResponse.json({ found: false, error: 'Трек не найден' });
        }

        return NextResponse.json({
            found: true,
            source: 'JAMENDO',
            jamendoId: bestMatch.id,
            title: bestMatch.name,
            artist: bestMatch.artist_name,
            album: bestMatch.album_name || '',
            duration: bestMatch.duration,
            releaseDate: bestMatch.releasedate,
            downloadUrl: bestMatch.audio,
            previewUrl: bestMatch.audiodownload,
            license: bestMatch.license_ccurl,
            _score: bestScore,
        });
    } catch (err: any) {
        return NextResponse.json({ found: false, error: String(err) });
    }
}