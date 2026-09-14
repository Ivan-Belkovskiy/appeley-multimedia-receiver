'use client';

import { parseBlob } from 'music-metadata-browser';
import { IAudioMetadata } from 'music-metadata-browser';

export async function readID3FromFile(file: File | Blob): Promise<IAudioMetadata> {
    return await parseBlob(file, {
        duration: true,
        skipCovers: true,
    });
}

export async function readID3FromBlobUrl(blobUrl: string): Promise<IAudioMetadata> {
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    return await parseBlob(blob, {
        duration: true,
        skipCovers: true,
    });
}