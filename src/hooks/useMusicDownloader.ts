'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    hashBlob,
    requestCapturesFolder,
    saveCaptureToFolder,
} from '@/utils/captureStorage';

import { ID3Writer } from 'browser-id3-writer';

export type DownloadStatus =
    | 'PENDING' | 'SEARCHING' | 'DOWNLOADING'
    | 'PROCESSING' | 'SAVING' | 'DONE'
    | 'NOT_FOUND' | 'FAILED';

export interface DownloadItem {
    id: string;
    radioTrackId: number;
    artist: string;
    title: string;
    isAdvert: boolean;
    status: DownloadStatus;
    progress: number;
    error?: string;
    result?: {
        artist: string;
        title: string;
        album?: string;
        source: string;
    };
    savedTo?: {
        folderName: string;
        fileName: string;
        sizeBytes: number;
    };
}

export function useMusicDownloader() {
    const [queue, setQueue] = useState<DownloadItem[]>([]);
    const [isProcessing, setProcessing] = useState(false);
    const [folderName, setFolderName] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const folderRef = useRef<FileSystemDirectoryHandle | null>(null);

    const queueRef = useRef<DownloadItem[]>([]);
    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    const updateItem = useCallback((id: string, patch: Partial<DownloadItem>) => {
        setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item));
    }, []);

    const addToQueue = useCallback((track: {
        id: number;
        title: string;
        isAdvert?: boolean;
    }) => {
        const parts = track.title.split(' - ');
        const artist = parts[0]?.trim() ?? '';
        const title = parts.slice(1).join(' - ').trim() || parts[0]?.trim() || '';

        const id = `${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        setQueue(q => [...q, {
            id,
            radioTrackId: track.id,
            artist,
            title,
            isAdvert: track.isAdvert ?? false,
            status: 'PENDING',
            progress: 0,
        }]);

        return id;
    }, []);

    const removeItem = useCallback((id: string) => {
        setQueue(q => q.filter(i => i.id !== id));
    }, []);

    const clearDone = useCallback(() => {
        setQueue(q => q.filter(i => i.status !== 'DONE' && i.status !== 'FAILED'));
    }, []);

    const ensureFolder = useCallback(async (): Promise<boolean> => {
        if (folderRef.current) {
            try {
                const perm = await (folderRef.current as any).queryPermission({ mode: 'readwrite' });
                if (perm === 'granted') return true;
                folderRef.current = null;
            } catch {
                folderRef.current = null;
            }
        }

        try {
            const handle = await requestCapturesFolder();
            if (!handle) {
                setGlobalError('Папка не выбрана');
                return false;
            }
            folderRef.current = handle;
            setFolderName(handle.name);
            setGlobalError(null);
            return true;
        } catch (err: any) {
            setGlobalError(err?.message ?? 'Не удалось выбрать папку');
            return false;
        }
    }, []);

    const processItem = useCallback(async (item: DownloadItem) => {
        try {
            if (item.isAdvert) {
                updateItem(item.id, {
                    status: 'FAILED',
                    error: 'Advert-треки обрабатываются через Capture в ресивере',
                });
                return;
            }

            updateItem(item.id, { status: 'SEARCHING', progress: 0 });

            const search = await fetch('/api/music/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artist: item.artist, title: item.title }),
            }).then(r => r.json());

            if (!search.found) {
                updateItem(item.id, {
                    status: 'NOT_FOUND',
                    error: search.error ?? 'Не найдено',
                });
                return;
            }

            updateItem(item.id, {
                status: 'DOWNLOADING',
                result: {
                    artist: search.artist,
                    title: search.title,
                    album: search.album,
                    source: search.source,
                },
            });

            const res = await fetch(search.downloadUrl);
            if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status}`);

            const reader = res.body.getReader();
            const chunks: Uint8Array[] = [];
            const total = Number(res.headers.get('content-length')) || 0;
            let received = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;
                if (total > 0) updateItem(item.id, { progress: received / total });
            }

            const rawBlob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });

            updateItem(item.id, { status: 'PROCESSING', progress: 1 });

            // const { default: ID3Writer } = await import('browser-id3-writer');
            const arrayBuffer = await rawBlob.arrayBuffer();
            const writer = new ID3Writer(arrayBuffer);

            writer
                .setFrame('TIT2', search.title)
                .setFrame('TPE1', [search.artist])
                .setFrame('TALB', search.album || 'Unknown Album');

            writer.addTag();
            const taggedBlob = writer.getBlob();

            updateItem(item.id, { status: 'SAVING' });

            if (!folderRef.current) {
                throw new Error('Папка потеряна');
            }

            const hash = await hashBlob(taggedBlob);
            const safeName = `${search.artist} - ${search.title}`
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
                .slice(0, 200);

            const saved = await saveCaptureToFolder(
                folderRef.current,
                taggedBlob,
                `${safeName}.mp3`,
            );

            await fetch('/api/music/record-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    radioTrackId: item.radioTrackId,
                    fileHash: hash,
                    fileName: saved.fileName,
                    fileSizeBytes: saved.sizeBytes,
                    durationSec: search.duration,
                    targetType: 'local',
                    targetName: folderRef.current.name,
                }),
            });

            updateItem(item.id, {
                status: 'DONE',
                savedTo: {
                    folderName: folderRef.current.name,
                    fileName: saved.fileName,
                    sizeBytes: saved.sizeBytes,
                },
            });

        } catch (err: any) {
            console.error('Download item failed:', err);
            updateItem(item.id, {
                status: 'FAILED',
                error: err?.message ?? String(err),
            });
        }
    }, [updateItem]);

    const processQueue = useCallback(async () => {
        if (isProcessing) return;

        setGlobalError(null);

        const ok = await ensureFolder();
        if (!ok) return;

        setProcessing(true);

        const pending = queueRef.current.filter(i => i.status === 'PENDING');

        if (pending.length === 0) {
            setProcessing(false);
            return;
        }

        for (const item of pending) {
            await processItem(item);
        }

        setProcessing(false);
    }, [isProcessing, ensureFolder, processItem]);

    const changeFolder = useCallback(async () => {
        folderRef.current = null;
        setFolderName(null);
        const ok = await ensureFolder();
        return ok;
    }, [ensureFolder]);

    const clearError = useCallback(() => setGlobalError(null), []);

    return {
        queue,
        isProcessing,
        folderName,
        globalError,
        addToQueue,
        removeItem,
        clearDone,
        processQueue,
        changeFolder,
        clearError,
    };
}