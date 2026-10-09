import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACOUSTID_KEY = process.env.ACOUSTID_API_KEY!;
const MUSICBRAINZ_UA = 'AppeleyReceiver/1.0';
// const MUSICBRAINZ_UA = 'AppeleyReceiver/1.0 (https://github.com/your-username)';

interface AcoustIDResponse {
    status: 'ok' | 'error';
    results: Array<{
        id: string;
        score: number;
        recordings: Array<{
            id: string;
            title: string;
            artists: Array<{ id: string; name: string }>;
            releasegroups?: Array<{ id: string; title: string; type: string }>;
        }>;
    }>;
    error?: { code: number; message: string };
}

export async function POST(req: NextRequest) {
    const { fingerprint, duration } = await req.json();

    if (!fingerprint || !duration) {
        return NextResponse.json(
            { ok: false, error: 'fingerprint and duration required' },
            { status: 400 },
        );
    }

    try {
        const params = new URLSearchParams({
            client: ACOUSTID_KEY,
            duration: String(duration),
            fingerprint,
            meta: 'recordings+releasegroups+compress',
        });

        const acoustidRes = await fetch('https://api.acoustid.org/v2/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
            signal: AbortSignal.timeout(10_000),
        });

        const acoustidData: AcoustIDResponse = await acoustidRes.json();

        if (acoustidData.status !== 'ok') {
            return NextResponse.json({
                ok: false,
                error: acoustidData.error?.message ?? 'AcoustID error',
            });
        }

        const best = acoustidData.results
            .filter(r => r.score >= 0.7)
            .sort((a, b) => b.score - a.score)[0];

        if (!best || !best.recordings?.[0]) {
            return NextResponse.json({ ok: false, error: 'NOT_FOUND' });
        }

        const recording = best.recordings[0];
        const artist = recording.artists.map(a => a.name).join(', ');
        const title = recording.title;
        const releaseGroup = recording.releasegroups?.[0];
        const album = releaseGroup?.title;

        let year: number | undefined;
        let coverUrl: string | undefined;
        let genre: string | undefined;

        if (releaseGroup?.id) {
            try {
                const mbRes = await fetch(
                    `https://musicbrainz.org/ws/2/release-group/${releaseGroup.id}?inc=releases+genres&fmt=json`,
                    { headers: { 'User-Agent': MUSICBRAINZ_UA } },
                );
                const mbData = await mbRes.json();
                const release = mbData.releases?.[0];
                if (release?.date) year = parseInt(release.date.slice(0, 4), 10);
                genre = mbData.genres?.[0]?.name;

                coverUrl = `https://coverartarchive.org/release-group/${releaseGroup.id}/front-500`;
            } catch (err) {
                console.warn('MusicBrainz fetch failed:', err);
            }
        }

        return NextResponse.json({
            ok: true,
            match: {
                acoustidScore: best.score,
                recordingId: recording.id,
                artist,
                title,
                album,
                year,
                genre,
                coverUrl,
            },
        });
    } catch (err: any) {
        console.error('[radio-recognize]', err);
        return NextResponse.json(
            { ok: false, error: err?.message ?? String(err) },
            { status: 500 },
        );
    }
}