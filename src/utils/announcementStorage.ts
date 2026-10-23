'use client';

const STORAGE_KEY = 'appeley:announcementRef';
const SAMPLE_RATE = 16000; 
const MAX_DURATION_SEC = 12;
const FILE_URL = '/audio/internet-radio/101smoothjazz/announcement.wav';  

export interface AnnouncementRef {
    samples: Float32Array;
    sampleRate: number;
    source: 'file' | 'recording';
    recordedAt: number;
}

let cachedRef: AnnouncementRef | null = null;
let cachedPromise: Promise<AnnouncementRef | null> | null = null;

export async function loadAnnouncementRef(): Promise<AnnouncementRef | null> {
    if (cachedPromise) return cachedPromise;

    cachedPromise = (async () => {
        const rec = loadFromLocalStorage();
        if (rec) {
            cachedRef = rec;
            console.log(`✅ Announcement loaded from recording (${(rec.samples.length / rec.sampleRate).toFixed(1)}s)`);
            return rec;
        }

        const file = await loadFromFile(FILE_URL);
        if (file) {
            cachedRef = file;
            console.log(`✅ Announcement loaded from file (${(file.samples.length / file.sampleRate).toFixed(1)}s)`);
            return file;
        }

        console.log('⚠️ No announcement reference available');
        return null;
    })();

    return cachedPromise;
}

export function getCachedAnnouncementRef(): AnnouncementRef | null {
    return cachedRef;
}

export function resetAnnouncementCache(): void {
    cachedRef = null;
    cachedPromise = null;
}

async function loadFromFile(url: string): Promise<AnnouncementRef | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status !== 404) console.warn(`Announcement file fetch failed: ${res.status}`);
            return null;
        }

        const arrayBuffer = await res.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        try {
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const numChannels = audioBuffer.numberOfChannels;
            const length = audioBuffer.length;
            const samples = new Float32Array(length);

            if (numChannels === 1) {
                samples.set(audioBuffer.getChannelData(0));
            } else {
                for (let ch = 0; ch < numChannels; ch++) {
                    const data = audioBuffer.getChannelData(ch);
                    for (let i = 0; i < length; i++) samples[i] += data[i];
                }
                for (let i = 0; i < length; i++) samples[i] /= numChannels;
            }

            return {
                samples,
                sampleRate: audioBuffer.sampleRate,
                source: 'file',
                recordedAt: 0,
            };
        } finally {
            audioCtx.close();
        }
    } catch (err) {
        console.warn('Failed to load announcement file:', err);
        return null;
    }
}

function loadFromLocalStorage(): AnnouncementRef | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);

        const binary = atob(parsed.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const int16 = new Int16Array(bytes.buffer);
        const samples = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) samples[i] = int16[i] / 32768;

        return {
            samples,
            sampleRate: parsed.sampleRate,
            source: 'recording',
            recordedAt: parsed.recordedAt,
        };
    } catch (err) {
        console.warn('Failed to load announcement from localStorage:', err);
        return null;
    }
}

export function saveAnnouncementRef(ref: {
    samples: Float32Array;
    sampleRate: number;
    recordedAt: number;
}): void {
    let mono = ref.samples;
    if (ref.sampleRate !== SAMPLE_RATE) {
        mono = resampleLinear(mono, ref.sampleRate, SAMPLE_RATE);
    }

    const maxSamples = MAX_DURATION_SEC * SAMPLE_RATE;
    if (mono.length > maxSamples) mono = mono.slice(0, maxSamples);

    const int16 = new Int16Array(mono.length);
    for (let i = 0; i < mono.length; i++) {
        const s = Math.max(-1, Math.min(1, mono[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: base64,
        sampleRate: SAMPLE_RATE,
        recordedAt: Date.now(),
    }));

    resetAnnouncementCache();
}

export function clearAnnouncementRef(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    resetAnnouncementCache();
}

function resampleLinear(input: Float32Array, from: number, to: number): Float32Array {
    const ratio = to / from;
    const outLen = Math.floor(input.length * ratio);
    const output = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
        const srcPos = i / ratio;
        const srcIdx = Math.floor(srcPos);
        const frac = srcPos - srcIdx;
        const a = input[srcIdx] || 0;
        const b = input[srcIdx + 1] || 0;
        output[i] = a + (b - a) * frac;
    }
    return output;
}