import { NextRequest, NextResponse } from 'next/server';
import { getInternetRadioStations } from '@/app/actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;  

interface ICYMetadata {
    title: string;
    artist: string;
    raw: string;
}

async function readOneIcyMetadata(
    streamUrl: string,
    signal: AbortSignal,
    timeoutMs = 8000,
): Promise<ICYMetadata | null> {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    const combinedSignal = AbortSignal.any([signal, timeoutController.signal]);

    try {
        const response = await fetch(streamUrl, {
            headers: { 'Icy-MetaData': '1' },
            signal: combinedSignal,
        });

        if (!response.ok || !response.body) return null;

        const metaint = parseInt(response.headers.get('icy-metaint') || '0', 10);
        if (!metaint || metaint <= 0) return null;

        const reader = response.body.getReader();
        let bytesToSkip = metaint;
        let metadataLength = 0;
        let metadataBuffer: number[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            let offset = 0;

            if (bytesToSkip > 0) {
                const skip = Math.min(bytesToSkip, value.length - offset);
                offset += skip;
                bytesToSkip -= skip;
                if (bytesToSkip > 0) continue;
            }

            if (offset < value.length && metadataLength === 0) {
                metadataLength = value[offset] * 16;
                offset += 1;

                if (metadataLength === 0) {
                    bytesToSkip = metaint;
                    continue;
                }
            }

            if (metadataLength > 0 && offset < value.length) {
                const need = metadataLength - metadataBuffer.length;
                const take = Math.min(need, value.length - offset);

                for (let i = 0; i < take; i++) {
                    metadataBuffer.push(value[offset + i]);
                }
                offset += take;

                if (metadataBuffer.length >= metadataLength) {
                    reader.cancel().catch(() => {});

                    const text = new TextDecoder('utf-8')
                        .decode(new Uint8Array(metadataBuffer))
                        .replace(/\0+$/g, '')
                        .trim();

                    const match = text.match(/StreamTitle='([^']*)'/);
                    if (!match) return null;

                    const raw = match[1].trim();
                    const [artist, song] = raw.split(' - ').map(s => s.trim());

                    return {
                        title: song || raw,
                        artist: artist || '',
                        raw,
                    };
                }
            }
        }

        reader.cancel().catch(() => {});
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function GET(request: NextRequest) {
    const res = await getInternetRadioStations();
    if (!res.success || !res.data) {
        return NextResponse.json({ error: 'Stations not found' }, { status: 404 });
    }

    const ALLOWED_HOSTS = res.data.map(s => new URL(s.url).hostname);

    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    try {
        const host = new URL(url).hostname;
        if (!ALLOWED_HOSTS.includes(host)) {
            return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const metadata = await readOneIcyMetadata(url, request.signal);

        if (!metadata) {
            return NextResponse.json(
                { error: 'No metadata available' },
                { status: 204 }, 
            );
        }

        return NextResponse.json(metadata, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            return NextResponse.json({ error: 'Aborted' }, { status: 499 });
        }
        console.error('Radio metadata error:', error);
        return NextResponse.json({ error: 'Stream error' }, { status: 500 });
    }
}






// import { NextRequest, NextResponse } from 'next/server';
// import { parseIcyResponse } from '@music-metadata/icy';
// import { getInternetRadioStations } from '@/app/actions';

// // const ALLOWED_HOSTS = [
// //     'jking.cdnstream1.com',
// //     'smoothjazz.cdnstream1.com',
// //     'streaming.live365.com',
// //     'stream.srg-ssr.ch',
// //     'live.wostreaming.net',
// // ];

// export async function GET(request: NextRequest) {
    
//     const res = await getInternetRadioStations();

//     if (!res.success && !res.data) return new NextResponse('Radio Stations not found', { status: 404 });

//     const ALLOWED_HOSTS = res.data?.map(s => new URL(s.url).hostname) || [];

//     if (!ALLOWED_HOSTS || ALLOWED_HOSTS.length === 0) return new NextResponse('Radio Stations not found', { status: 404 });

//     const url = request.nextUrl.searchParams.get('url');
//     if (!url) {
//         return new NextResponse('Missing url', { status: 400 });
//     }

//     try {
//         const host = new URL(url).hostname;
//         if (!ALLOWED_HOSTS.includes(host)) {
//             // return NextResponse.json(ALLOWED_HOSTS);
//             return new NextResponse('Host not allowed', { status: 403 });
//         }
//     } catch {
//         return new NextResponse('Invalid URL', { status: 400 });
//     }

//     const stream = new ReadableStream({
//         async start(controller) {
//             const encoder = new TextEncoder();
//             const sendEvent = (data: any) => {
//                 controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
//             };

//             try {
//                 const response = await fetch(url, {
//                     headers: { 'Icy-MetaData': '1' },
//                 });

//                 if (!response.ok) {
//                     sendEvent({ error: 'Failed to connect to stream' });
//                     controller.close();
//                     return;
//                 }

//                 let metadataSent = false;
//                 let streamClosed = false;

//                 const timeoutId = setTimeout(() => {
//                     if (!metadataSent && !streamClosed) {
//                         sendEvent({ error: 'Metadata timeout' });
//                         controller.close();
//                     }
//                 }, 10000);

//                 const audioStream = parseIcyResponse(response, ({ metadata }) => {
//                     const title = metadata.StreamTitle;
//                     if (title && !metadataSent) {
//                         metadataSent = true;
//                         clearTimeout(timeoutId);

//                         const [artist, song] = title.split(' - ').map(s => s.trim());
//                         sendEvent({
//                             title: song || title,
//                             artist: artist || '',
//                             raw: title,
//                         });

//                         controller.close();
//                     }
//                 });

//                 const emptySink = new WritableStream({
//                     write() {

//                     },
//                 });

//                 audioStream
//                     .pipeTo(emptySink)
//                     .catch((err) => {
//                         console.error('Stream pipe error:', err);
//                     })
//                     .finally(() => {
//                         streamClosed = true;
//                         clearTimeout(timeoutId);
//                         if (!metadataSent) {
//                             try {
//                                 sendEvent({ error: 'No metadata' });
//                                 controller.close();
//                             } catch {
//                             }
//                         }
//                     });

//             } catch (error) {
//                 console.error('Radio metadata error:', error);
//                 sendEvent({ error: 'Stream error' });
//                 controller.close();
//             }
//         },
//     });

//     // return new NextResponse(stream, {
//     //     headers: {
//     //         'Content-Type': 'text/event-stream',
//     //         'Cache-Control': 'no-cache',
//     //         'Connection': 'keep-alive',
//     //     },
//     // });

//     return new NextResponse(stream, {
//         headers: {
//             'Content-Type': 'text/event-stream',
//             'Cache-Control': 'no-cache, no-transform',
//             'Connection': 'keep-alive',
//             'X-Accel-Buffering': 'no',
//         },
//     });
// }












// // const ALLOWED_HOSTS = [
// //     'jking.cdnstream1.com',
// //     'smoothjazz.cdnstream1.com',
// //     'streaming.live365.com',
// //     'stream.srg-ssr.ch',
// //     'live.wostreaming.net',
// // ];

// // export async function GET(request: NextRequest) {

// //     const res = await getInternetRadioStations();

// //     if (!res.success && !res.data) return new NextResponse('Radio Stations not found', { status: 404 });

// //     const ALLOWED_HOSTS = res.data?.map(s => new URL(s.url).hostname) || [];

// //     if (!ALLOWED_HOSTS || ALLOWED_HOSTS.length === 0) return new NextResponse('Radio Stations not found', { status: 404 });

// //     const url = request.nextUrl.searchParams.get('url');
// //     if (!url) return new NextResponse('Missing url', { status: 400 });

// //     try {
// //         const host = new URL(url).hostname;
// //         if (!ALLOWED_HOSTS.includes(host)) {
// //             return new NextResponse('Host not allowed', { status: 403 });
// //         }
// //     } catch {
// //         return new NextResponse('Invalid URL', { status: 400 });
// //     }

// //     const stream = new ReadableStream({
// //         async start(controller) {
// //             const encoder = new TextEncoder();
// //             let closed = false;

// //             const sendEvent = (data: any) => {
// //                 if (closed) return;
// //                 try {
// //                     controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
// //                 } catch (e) {
// //                     closed = true;
// //                 }
// //             };

// //             const sendCheckSignal = () => {
// //                 if (closed) return;
// //                 try {
// //                     controller.enqueue(encoder.encode(`: Metadata Stream is Working!!!\n\n`));
// //                 } catch (e) {
// //                     closed = true;
// //                 }
// //             };

// //             const workingInterval = setInterval(sendCheckSignal, 15_000);

// //             const cleanup = () => {
// //                 if (closed) return;
// //                 closed = true;
// //                 clearInterval(workingInterval);
// //                 try { controller.close(); } catch {}
// //             };

// //             const runStream = async () => {
// //                 while (!closed) {
// //                     try {
// //                         console.log('📡 Connecting to upstream:', url);
// //                         const response = await fetch(url, {
// //                             headers: { 'Icy-MetaData': '1' },
// //                         });

// //                         if (!response.ok || !response.body) {
// //                             console.error('Upstream error:', response.status);
// //                             sendEvent({ error: 'Upstream unavailable' });
// //                             await new Promise(r => setTimeout(r, 3000));
// //                             continue;
// //                         }

// //                         console.log('✅ Upstream connected');
// //                         await parseIcyResponse(response, ({ metadata }) => {
// //                             if (closed) return;
// //                             const title = metadata.StreamTitle;
// //                             if (title) {
// //                                 const [artist, song] = title.split(' - ').map(s => s.trim());
// //                                 sendEvent({
// //                                     title: song || title,
// //                                     artist: artist || '',
// //                                     raw: title,
// //                                 });
// //                             }
// //                         });

// //                         console.log('⚠️ Upstream stream ended, reconnecting...');
// //                     } catch (err) {
// //                         console.error('Stream error:', err);
// //                     }

// //                     await new Promise(r => setTimeout(r, 2000));
// //                 }
// //             };

// //             runStream().finally(cleanup);

// //             request.signal.addEventListener('abort', () => {
// //                 console.log('🔌 Client aborted connection');
// //                 cleanup();
// //             });
// //         },
// //     });

// //     return new NextResponse(stream, {
// //         headers: {
// //             'Content-Type': 'text/event-stream',
// //             'Cache-Control': 'no-cache, no-transform',
// //             'Connection': 'keep-alive',
// //             'X-Accel-Buffering': 'no', 
// //         },
// //     });
// // }