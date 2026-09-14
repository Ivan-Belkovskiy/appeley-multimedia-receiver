import { NextRequest, NextResponse } from 'next/server';
import { parseIcyResponse } from '@music-metadata/icy';
import { getInternetRadioStations } from '@/app/actions';

// const ALLOWED_HOSTS = [
//     'jking.cdnstream1.com',
//     'smoothjazz.cdnstream1.com',
//     'streaming.live365.com',
//     'stream.srg-ssr.ch',
//     'live.wostreaming.net',
// ];

export async function GET(request: NextRequest) {
    
    const res = await getInternetRadioStations();

    if (!res.success && !res.data) return new NextResponse('Radio Stations not found', { status: 404 });

    const ALLOWED_HOSTS = res.data?.map(s => new URL(s.url).hostname) || [];

    if (!ALLOWED_HOSTS || ALLOWED_HOSTS.length === 0) return new NextResponse('Radio Stations not found', { status: 404 });

    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return new NextResponse('Missing url', { status: 400 });
    }

    try {
        const host = new URL(url).hostname;
        if (!ALLOWED_HOSTS.includes(host)) {
            // return NextResponse.json(ALLOWED_HOSTS);
            return new NextResponse('Host not allowed', { status: 403 });
        }
    } catch {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                const response = await fetch(url, {
                    headers: { 'Icy-MetaData': '1' },
                });

                if (!response.ok) {
                    sendEvent({ error: 'Failed to connect to stream' });
                    controller.close();
                    return;
                }

                let metadataSent = false;
                let streamClosed = false;

                const timeoutId = setTimeout(() => {
                    if (!metadataSent && !streamClosed) {
                        sendEvent({ error: 'Metadata timeout' });
                        controller.close();
                    }
                }, 10000);

                const audioStream = parseIcyResponse(response, ({ metadata }) => {
                    const title = metadata.StreamTitle;
                    if (title && !metadataSent) {
                        metadataSent = true;
                        clearTimeout(timeoutId);

                        const [artist, song] = title.split(' - ').map(s => s.trim());
                        sendEvent({
                            title: song || title,
                            artist: artist || '',
                            raw: title,
                        });

                        controller.close();
                    }
                });

                const emptySink = new WritableStream({
                    write() {

                    },
                });

                audioStream
                    .pipeTo(emptySink)
                    .catch((err) => {
                        console.error('Stream pipe error:', err);
                    })
                    .finally(() => {
                        streamClosed = true;
                        clearTimeout(timeoutId);
                        if (!metadataSent) {
                            try {
                                sendEvent({ error: 'No metadata' });
                                controller.close();
                            } catch {
                            }
                        }
                    });

            } catch (error) {
                console.error('Radio metadata error:', error);
                sendEvent({ error: 'Stream error' });
                controller.close();
            }
        },
    });

    // return new NextResponse(stream, {
    //     headers: {
    //         'Content-Type': 'text/event-stream',
    //         'Cache-Control': 'no-cache',
    //         'Connection': 'keep-alive',
    //     },
    // });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}