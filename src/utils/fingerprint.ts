'use client';

import { fingerprintFromSamples } from 'rusty-chromaprint-wasm';

export async function computeFingerprint(audioBlob: Blob): Promise<{
    fingerprint: string;
    duration: number;
}> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const channelData = audioBuffer.numberOfChannels > 1
        ? (() => {
            const left = audioBuffer.getChannelData(0);
            const right = audioBuffer.getChannelData(1);
            const mono = new Float32Array(left.length);
            for (let i = 0; i < left.length; i++) {
                mono[i] = (left[i] + right[i]) / 2;
            }
            return mono;
        })()
        : audioBuffer.getChannelData(0);

    const samples = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
        const clamped = Math.max(-1, Math.min(1, channelData[i]));
        samples[i] = Math.round(clamped * 32767);
    }

    const result = fingerprintFromSamples(
        audioBuffer.sampleRate,
        1, 
        samples,
    );

    return {
        fingerprint: result.compressed,
        duration: Math.round(audioBuffer.duration),
    };
}