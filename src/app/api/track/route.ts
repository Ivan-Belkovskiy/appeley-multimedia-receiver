import { NextRequest, NextResponse } from 'next/server';
import fs, { readdirSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    // const { searchParams } = new URL(request.url);
    const { searchParams } = request.nextUrl;
    const folderUrl = searchParams.get('folderUrl');
    const trackName = searchParams.get('trackName');

    // return NextResponse.json({
    //     folderUrl,
    //     track
    // });

    if (!folderUrl || !trackName) {
        return new NextResponse('Missing parameters', { status: 400 });
    }

    const decodedUrl = decodeURIComponent(folderUrl);
    const decodedName = decodeURIComponent(trackName);

    // const dirContents = readdirSync(decodedUrl, { withFileTypes: true });

    // dirContents

    const filePath = path.join(decodedUrl, decodedName);

    // return NextResponse.json({
    //     path: folderUrl
    // });

    if (!fs.existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const range = request.headers.get('range');

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        const fileStream = fs.createReadStream(filePath, { start, end });

        return new NextResponse(fileStream as any, {
            status: 206,
            headers: {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize.toString(),
                'Content-Type': 'audio/mpeg', // FLAC - 'audio/flac' | WAV - 'audio/wav'
            },
        });
    } else {
        const fileStream = fs.createReadStream(filePath);

        return new NextResponse(fileStream as any, {
            status: 200,
            headers: {
                'Content-Length': fileSize.toString(),
                'Content-Type': 'audio/mpeg',
            },
        });
    }
}