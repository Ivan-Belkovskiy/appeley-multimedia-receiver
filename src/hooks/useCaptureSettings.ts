'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCaptureSettings, updateCaptureSettings } from '@/app/captureSettings.actions';

export interface CaptureSettings {
    storageType: 'local' | 'vercel_blob' | 'electron' | 'all';
    captureDurationMs: number;
    autoCaptureAdvert: boolean;
    aiRecognitionEnabled: boolean;
    aiService: 'acrcloud' | 'audd' | 'shazam';
}

export function useCaptureSettings() {
    const [settings, setSettings] = useState<CaptureSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getCaptureSettings();
            if (cancelled) return;
            if (res.success) setSettings(res.data);
            else setError(res.error);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const update = useCallback(async (partial: Partial<CaptureSettings>) => {
        if (!settings) return;

        const prev = settings;
        const next = { ...settings, ...partial };

        setSettings(next);
        setSaving(true);
        setError(null);

        const res = await updateCaptureSettings(next);

        if (!res.success) {
            setSettings(prev);
            setError(res.error);
        } else {
            setSettings(res.data);
        }

        setSaving(false);
    }, [settings]);

    return { settings, loading, saving, error, update };
}