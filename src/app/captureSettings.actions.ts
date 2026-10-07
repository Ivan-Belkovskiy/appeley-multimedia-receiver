'use server';

import { prisma } from '@/lib/prisma';
import type { CaptureSettings } from '@/hooks/useCaptureSettings';

const DEFAULT_CAPTURE_SETTINGS: CaptureSettings = {
    storageType: 'local',
    captureDurationMs: 30_000,
    autoCaptureAdvert: true,
    aiRecognitionEnabled: false,
    aiService: 'acrcloud',
};

type ValueType = 'string' | 'number' | 'boolean' | 'json';

function inferType(value: unknown): ValueType {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object' && value !== null) return 'json';
    return 'string';
}

function serialize(value: unknown): string {
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return String(value);
}

function deserialize(value: string, type: ValueType): unknown {
    switch (type) {
        case 'number': {
            const n = Number(value);
            return Number.isFinite(n) ? n : 0;
        }
        case 'boolean':
            return value === 'true';
        case 'json':
            try { return JSON.parse(value); } catch { return null; }
        default:
            return value;
    }
}

async function readSetting<T>(key: string, fallback: T): Promise<T> {
    try {
        const row = await prisma.internet_radio_capture_settings.findUnique({
            where: { key },
        });
        if (!row) return fallback;

        const parsed = deserialize(row.value, row.value_type as ValueType);
        return parsed === null ? fallback : (parsed as T);
    } catch (error) {
        console.error(`readSetting("${key}") failed:`, error);
        return fallback;
    }
}

async function writeSetting(key: string, value: unknown): Promise<void> {
    const valueType = inferType(value);
    const stringValue = serialize(value);

    if (stringValue.length > 500) {
        console.warn(`writeSetting("${key}"): value too long, truncating`);
    }
    const truncated = stringValue.slice(0, 500);

    await prisma.internet_radio_capture_settings.upsert({
        where: { key },
        create: { key, value: truncated, value_type: valueType },
        update: { value: truncated, value_type: valueType },
    });
}

export async function getCaptureSettings(): Promise<
    { success: true; data: CaptureSettings } | { success: false; error: string }
> {
    try {
        const [
            storageType,
            captureDurationMs,
            autoCaptureAdvert,
            aiRecognitionEnabled,
            aiService,
        ] = await Promise.all([
            readSetting('capture.storageType', DEFAULT_CAPTURE_SETTINGS.storageType),
            readSetting('capture.captureDurationMs', DEFAULT_CAPTURE_SETTINGS.captureDurationMs),
            readSetting('capture.autoCaptureAdvert', DEFAULT_CAPTURE_SETTINGS.autoCaptureAdvert),
            readSetting('capture.aiRecognitionEnabled', DEFAULT_CAPTURE_SETTINGS.aiRecognitionEnabled),
            readSetting('capture.aiService', DEFAULT_CAPTURE_SETTINGS.aiService),
        ]);

        const validStorageTypes: CaptureSettings['storageType'][] = [
            'local', 'vercel_blob', 'electron', 'all',
        ];
        const validAIServices: CaptureSettings['aiService'][] = [
            'acrcloud', 'audd', 'shazam',
        ];

        const data: CaptureSettings = {
            storageType: validStorageTypes.includes(storageType as any)
                ? (storageType as CaptureSettings['storageType'])
                : DEFAULT_CAPTURE_SETTINGS.storageType,

            captureDurationMs: Math.min(
                Math.max(Number(captureDurationMs) || 30_000, 10_000),
                120_000,
            ),

            autoCaptureAdvert: Boolean(autoCaptureAdvert),
            aiRecognitionEnabled: Boolean(aiRecognitionEnabled),

            aiService: validAIServices.includes(aiService as any)
                ? (aiService as CaptureSettings['aiService'])
                : DEFAULT_CAPTURE_SETTINGS.aiService,
        };

        return { success: true, data };
    } catch (error) {
        console.error('getCaptureSettings error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function updateCaptureSettings(
    settings: CaptureSettings,
): Promise<
    { success: true; data: CaptureSettings } | { success: false; error: string }
> {
    try {
        const sanitized: CaptureSettings = {
            storageType: settings.storageType,
            captureDurationMs: Math.min(
                Math.max(Number(settings.captureDurationMs) || 30_000, 10_000),
                120_000,
            ),
            autoCaptureAdvert: Boolean(settings.autoCaptureAdvert),
            aiRecognitionEnabled: Boolean(settings.aiRecognitionEnabled),
            aiService: settings.aiService,
        };

        await Promise.all([
            writeSetting('capture.storageType', sanitized.storageType),
            writeSetting('capture.captureDurationMs', sanitized.captureDurationMs),
            writeSetting('capture.autoCaptureAdvert', sanitized.autoCaptureAdvert),
            writeSetting('capture.aiRecognitionEnabled', sanitized.aiRecognitionEnabled),
            writeSetting('capture.aiService', sanitized.aiService),
        ]);

        return { success: true, data: sanitized };
    } catch (error) {
        console.error('updateCaptureSettings error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function resetCaptureSettings(): Promise<
    { success: true; data: CaptureSettings } | { success: false; error: string }
> {
    return updateCaptureSettings(DEFAULT_CAPTURE_SETTINGS);
}