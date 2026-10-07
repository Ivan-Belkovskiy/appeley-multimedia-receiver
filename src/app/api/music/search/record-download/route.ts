import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, error: 'No body' }, { status: 400 });

    const {
        radioTrackId,
        fileHash,
        fileName,
        fileSizeBytes,
        durationSec,
        targetType,
        targetName,
        targetPath,
        blobUrl,
    } = body;

    if (!radioTrackId || !fileHash || !fileName || !targetType) {
        return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    try {
        const [record] = await prisma.$transaction([
            prisma.downloaded_tracks.create({
                data: {
                    radio_track_id: radioTrackId,
                    file_hash: fileHash,
                    file_name: fileName,
                    file_size_bytes: fileSizeBytes ?? null,
                    duration_sec: durationSec ?? null,
                    target_type: targetType,
                    target_name: targetName ?? null,
                    target_path: targetPath ?? null,
                    blob_url: blobUrl ?? null,
                },
            }),
            prisma.internet_radio_tracks.update({
                where: { id: radioTrackId },
                data: {
                    download_count: { increment: 1 },
                    last_download_at: new Date(),
                },
            }),
        ]);

        return NextResponse.json({ success: true, data: record });
    } catch (err: any) {
        console.error('record-download error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}