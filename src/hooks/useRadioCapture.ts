'use client';

import { useCallback, useRef } from 'react';
import { saveCaptureToFolder, hashBlob, requestCapturesFolder } from '@/utils/captureStorage';

export interface CaptureResult {
    blob: Blob;
    durationMs: number;
    hash: string;
    savedTo?: {
        type: 'local';
        fileName: string;
        sizeBytes: number;
        folderName: string;
    };
}

export function useRadioCapture() {
    const abortRef = useRef<AbortController | null>(null);

    const cancelCapture = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
    }, []);


    const capture = useCallback(async (
        url: string,
        durationMs: number,
        options: {
            saveLocally?: boolean;
            filename?: string;
            onProgress?: (progress: number) => void;
            onStartDownloading?: () => void;
            onStartDetecting?: () => void;
        } = {},
    ): Promise<CaptureResult> => {
        const controller = new AbortController();
        abortRef.current = controller;

        const startedAt = Date.now();

        const res = await fetch('/api/radio-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, durationMs }),
            signal: controller.signal,
        });

        if (!res.ok || !res.body) {
            const err = await res.json().catch(() => ({ error: 'Unknown' }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        const chunks: Uint8Array[] = [];
        const reader = res.body.getReader();
        let receivedBytes = 0;
        const estimatedTotal = (durationMs / 1000) * 16_000;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!value) continue;

                chunks.push(value);
                receivedBytes += value.length;

                if (options.onProgress) {
                    options.onProgress(Math.min(receivedBytes / estimatedTotal, 0.95));
                }
            }
        } finally {
            abortRef.current = null;
        }

        const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
        const hash = await hashBlob(blob);
        const actualDurationMs = Date.now() - startedAt;

        options.onProgress?.(1);

        const result: CaptureResult = {
            blob,
            durationMs: actualDurationMs,
            hash,
        };

        if (options.saveLocally) {
            const folder = await requestCapturesFolder();
            if (!folder) throw new Error('Папка не выбрана');

            const fname = options.filename
                ?? `capture_${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`;

            options.onStartDownloading?.();

            const saved = await saveCaptureToFolder(folder, blob, fname);

            result.savedTo = {
                type: 'local',
                fileName: saved.fileName,
                sizeBytes: saved.sizeBytes,
                folderName: folder.name,
            };
        }

        return result;
    }, []);

    const recognize = useCallback(async (audioBlob: Blob) => {
        const { computeFingerprint } = await import('@/utils/fingerprint');
        const fp = await computeFingerprint(audioBlob);

        const res = await fetch('/api/radio-recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fingerprint: fp.fingerprint,
                duration: fp.duration,
            }),
        });

        return await res.json();
    }, []);

    return { capture, cancelCapture, recognize };
}