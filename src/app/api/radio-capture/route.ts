import { NextRequest, NextResponse } from 'next/server';
import { getInternetRadioStations } from '@/app/actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_DURATION_MS = 120_000;   

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    const url: string | undefined = body?.url;
    const durationMs: number = Math.min(
        Math.max(Number(body?.durationMs) || 30_000, 5_000),
        MAX_DURATION_MS,
    );

    if (!url) {
        return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const stationsRes = await getInternetRadioStations();
    if (!stationsRes.success || !stationsRes.data) {
        return NextResponse.json({ error: 'Stations not found' }, { status: 500 });
    }

    const ALLOWED_HOSTS = stationsRes.data.map(s => new URL(s.url).hostname);
    try {
        const host = new URL(url).hostname;
        if (!ALLOWED_HOSTS.includes(host)) {
            return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const abort = new AbortController();
    const onClientAbort = () => abort.abort();
    request.signal.addEventListener('abort', onClientAbort);

    let upstreamResponse: Response;
    try {
        upstreamResponse = await fetch(url, {
            headers: { 'Icy-MetaData': '1' },
            signal: abort.signal,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: `Upstream failed: ${err.message}` },
            { status: 502 },
        );
    }

    if (!upstreamResponse.ok || !upstreamResponse.body) {
        return NextResponse.json({ error: 'Stream unavailable' }, { status: 502 });
    }

    const metaint = parseInt(upstreamResponse.headers.get('icy-metaint') || '0', 10);
    const contentType = upstreamResponse.headers.get('content-type') || 'audio/mpeg';

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const reader = upstreamResponse.body!.getReader();
            const startTime = Date.now();

            let state: 'audio' | 'metaLen' | 'metaData' = 'audio';
            let audioRemaining = metaint > 0 ? metaint : Infinity;
            let metaPending = 0;

            const safeClose = () => {
                try { controller.close(); } catch {}
                reader.cancel().catch(() => {});
                request.signal.removeEventListener('abort', onClientAbort);
            };

            try {
                while (Date.now() - startTime < durationMs) {
                    if (abort.signal.aborted) break;

                    const { done, value } = await reader.read();
                    if (done || !value) break;

                    let pos = 0;
                    while (pos < value.length) {
                        if (abort.signal.aborted) break;

                        if (state === 'audio') {
                            const take = metaint > 0
                                ? Math.min(audioRemaining, value.length - pos)
                                : (value.length - pos);

                            controller.enqueue(value.subarray(pos, pos + take));
                            pos += take;
                            if (metaint > 0) {
                                audioRemaining -= take;
                                if (audioRemaining === 0) state = 'metaLen';
                            }
                        } else if (state === 'metaLen') {
                            metaPending = value[pos] * 16;
                            pos += 1;
                            if (metaPending === 0) {
                                state = 'audio';
                                audioRemaining = metaint;
                            } else {
                                state = 'metaData';
                            }
                        } else {
                            const take = Math.min(metaPending, value.length - pos);
                            pos += take;
                            metaPending -= take;
                            if (metaPending === 0) {
                                state = 'audio';
                                audioRemaining = metaint;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Capture stream error:', err);
            } finally {
                safeClose();
            }
        },

        cancel() {
            abort.abort();
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-store',
            'X-Capture-Duration': String(durationMs),
        },
    });
}