import { NextRequest, NextResponse } from 'next/server';
import { parseIcyResponse } from '@music-metadata/icy';

const ALLOWED_HOSTS = [
    'jking.cdnstream1.com',
    'smoothjazz.cdnstream1.com',
    'streaming.live365.com',
    'stream.srg-ssr.ch',
    'live.wostreaming.net',
];

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return new NextResponse('Missing url', { status: 400 });
    }

    try {
        const host = new URL(url).hostname;
        if (!ALLOWED_HOSTS.includes(host)) {
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

                parseIcyResponse(response, ({ metadata }) => {
                    const title = metadata.StreamTitle;
                    if (title) {
                        const [artist, song] = title.split(' - ').map(s => s.trim());
                        sendEvent({
                            title: song || title,
                            artist: artist || '',
                            raw: title,
                        });
                    }
                });

                sendEvent({ status: 'stream-ended' });
                controller.close();
            } catch (error) {
                console.error('Radio metadata error:', error);
                sendEvent({ error: 'Stream error' });
                controller.close();
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}