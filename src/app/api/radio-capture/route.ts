import { NextRequest, NextResponse } from 'next/server';
import { getInternetRadioStations } from '@/app/actions';

const CAPTURE_DURATION_MS = 10_000;
const MAX_BUFFER_BYTES = 5 * 1024 * 1024;

async function recognizeMusic(audioBuffer: Buffer, contentType: string) {
    const form = new FormData();
    form.append('file', new Blob([Buffer.copyBytesFrom(audioBuffer)], { type: contentType }), 'sample.mp3');
    form.append('api_token', "60e0c925ab4602b2512cd1465974119c");
    form.append('return', 'spotify,apple_music');

    const res = await fetch('https://api.audd.io/', {
        method: 'POST',
        body: form,
    });

    const data = await res.json();

    if (data.status !== 'success' || !data.result) {
        return { success: false, error: data.error?.error_message || 'No match' };
    }

    return {
        success: true,
        artist: data.result.artist ?? '',
        title: data.result.title ?? '',
        album: data.result.album ?? '',
        spotify: data.result.spotify?.external_urls?.spotify,
    };
}

export async function POST(request: NextRequest) {
    const stationsRes = await getInternetRadioStations();
    if (!stationsRes.success || !stationsRes.data) {
        return NextResponse.json({ error: 'Stations not found' }, { status: 404 });
    }

    const ALLOWED_HOSTS = stationsRes.data.map(s => new URL(s.url).hostname);

    const body = await request.json().catch(() => null);
    const url: string | undefined = body?.url;
    const durationMs = Math.min(body?.durationMs ?? CAPTURE_DURATION_MS, 30_000);

    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    try {
        const host = new URL(url).hostname;
        if (!ALLOWED_HOSTS.includes(host)) {
            return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const abort = new AbortController();
    const hardTimeout = setTimeout(() => abort.abort(), durationMs + 5_000);

    try {
        const response = await fetch(url, {
            headers: { 'Icy-MetaData': '1' },
            signal: abort.signal,
        });

        if (!response.ok || !response.body) {
            return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
        }

        const metaint = parseInt(response.headers.get('icy-metaint') || '0', 10);
        const contentType = response.headers.get('content-type') || 'audio/mpeg';

        const reader = response.body.getReader();
        const audioChunks: Uint8Array[] = [];
        let totalAudioBytes = 0;

        let state: 'audio' | 'metaLen' | 'metaData' = 'audio';
        let audioRemaining = metaint;
        let pendingMetaLen = 0;

        const startTime = Date.now();

        while (true) {
            if (Date.now() - startTime >= durationMs) break;
            if (totalAudioBytes >= MAX_BUFFER_BYTES) break;

            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            let pos = 0;
            while (pos < value.length) {
                if (state === 'audio') {
                    const take = metaint > 0
                        ? Math.min(audioRemaining, value.length - pos)
                        : (value.length - pos);

                    const slice = value.subarray(pos, pos + take);
                    audioChunks.push(slice);
                    totalAudioBytes += take;
                    pos += take;

                    if (metaint > 0) {
                        audioRemaining -= take;
                        if (audioRemaining === 0) state = 'metaLen';
                    }
                } else if (state === 'metaLen') {
                    pendingMetaLen = value[pos] * 16;
                    pos += 1;
                    if (pendingMetaLen === 0) {
                        state = 'audio';
                        audioRemaining = metaint;
                    } else {
                        state = 'metaData';
                    }
                } else {
                    const take = Math.min(pendingMetaLen, value.length - pos);
                    pos += take;
                    pendingMetaLen -= take;
                    if (pendingMetaLen === 0) {
                        state = 'audio';
                        audioRemaining = metaint;
                    }
                }
            }
        }

        reader.cancel().catch(() => {});
        clearTimeout(hardTimeout);

        const audioBuffer = Buffer.concat(audioChunks.map(c => Buffer.from(c)));

        if (audioBuffer.length === 0) {
            return NextResponse.json({ error: 'No audio captured' }, { status: 502 });
        }

        const recognition = await recognizeMusic(audioBuffer, contentType);

        return NextResponse.json({
            success: true,
            bytes: audioBuffer.length,
            durationMs: Date.now() - startTime,
            recognition,
        });

    } catch (error: any) {
        clearTimeout(hardTimeout);
        if (error?.name === 'AbortError') {
            return NextResponse.json({ error: 'Capture timeout' }, { status: 504 });
        }
        console.error('Radio capture error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}