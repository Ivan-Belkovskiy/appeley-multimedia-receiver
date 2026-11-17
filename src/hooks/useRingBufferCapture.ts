'use client';

import { useCallback, useRef } from 'react';
import { saveCaptureToFolder, requestCapturesFolder } from '@/utils/captureStorage';

interface RingBufferHandle {
    node: AudioWorkletNode;
    audioContext: AudioContext;
    sampleRate: number;
    bufferSizeSamples: number;
    numChannels: number;
}

import {
    computeRmsEnvelope,
    findAnnouncementInEnvelope,
    findEndSilenceSample,
    findStartSample,
} from '@/utils/audioTrim';
import { encodeMp3 } from '@/utils/mp3encode';
import { AppeleyID3Encoder } from '@/utils/id3Encoder';

export interface TrimOptions {
    startThresholdDb?: number;
    endSilenceThresholdDb?: number;
    minSilenceMs?: number;
    endMinSilenceMs?: number;
    preTrimMs?: number;
    maxEndSilenceMs?: number;
    startSearchStartSec?: number;
    startSearchEndSec?: number;
    endSearchBackSec?: number;
    useDoubleAttack?: boolean;
    useValidation?: boolean;
}

export interface SaveOptions {
    stereo?: boolean;
    trim?: TrimOptions | false;
    announcementRef?: { samples: Float32Array; sampleRate: number } | null;
}

export function useRingBufferCapture(maxSeconds = 300, numChannels = 2) {
    const handleRef = useRef<RingBufferHandle | null>(null);
    const msgId = useRef(0);

    const attach = useCallback(async (audioContext: AudioContext, source: AudioNode) => {
        if (handleRef.current) {
            try { handleRef.current.node.disconnect(); } catch { }
            handleRef.current = null;
        }

        await audioContext.audioWorklet.addModule('/worklets/ring-buffer.js');

        const sampleRate = audioContext.sampleRate;
        const bufferSizeSamples = Math.floor(maxSeconds * sampleRate);

        const node = new AudioWorkletNode(audioContext, 'ring-buffer', {
            numberOfInputs: 1,
            numberOfOutputs: 0,
            channelCount: numChannels,
            channelCountMode: 'explicit',
            channelInterpretation: 'speakers',
            processorOptions: { bufferSize: bufferSizeSamples, numChannels },
        });

        source.connect(node);

        handleRef.current = { node, audioContext, sampleRate, bufferSizeSamples, numChannels };
    }, [maxSeconds, numChannels]);

    const detach = useCallback(() => {
        const h = handleRef.current;
        if (!h) return;
        try { h.node.disconnect(); } catch { }
        handleRef.current = null;
    }, []);

    const readLast = useCallback(async (seconds: number): Promise<Float32Array[] | null> => {
        const h = handleRef.current;
        if (!h) return null;

        const length = Math.min(Math.floor(seconds * h.sampleRate), h.bufferSizeSamples);
        const id = ++msgId.current;

        return new Promise((resolve) => {
            const onMessage = (e: MessageEvent) => {
                if (e.data.type === 'slice' && e.data.id === id) {
                    h.node.port.removeEventListener('message', onMessage);
                    resolve(e.data.channels);
                }
            };
            h.node.port.addEventListener('message', onMessage);
            h.node.port.start();
            h.node.port.postMessage({ type: 'read', id, length });
        });
    }, []);

    const applyFadeInOut = (
        data: Float32Array[],
        fadeInSamples: number,
        fadeOutSamples: number,
    ) => {
        const full = data[0].length;

        const fadeInLength = Math.min(fadeInSamples, Math.floor(full / 2));
        for (let i = 0; i < fadeInLength; i++) {
            data[0][i] *= 0.5 * (1 - Math.cos((Math.PI * i) / fadeInLength));
            data[1][i] *= 0.5 * (1 - Math.cos((Math.PI * i) / fadeInLength));
        }

        const fadeOutLength = Math.min(fadeOutSamples, Math.floor(full / 2));
        const fadeOutStart = full - fadeOutLength;
        for (let i = 0; i < fadeOutLength; i++) {
            data[0][fadeOutStart + i] *= 0.5 * (1 + Math.cos((Math.PI * i) / fadeOutLength));
            data[1][fadeOutStart + i] *= 0.5 * (1 + Math.cos((Math.PI * i) / fadeOutLength));
        }
    }

    const saveToMp3 = useCallback(async (
        seconds: number,
        filename: string,
        options: SaveOptions = {},
        events?: {
            onStartEncoding?: () => void;
            onEndEncoding?: () => void;
            onEncodingError?: () => void;
        }
    ) => {
        const channels = await readLast(seconds);
        if (!channels || channels.length === 0) throw new Error('Ring buffer is not attached or empty');

        const sampleRate = handleRef.current!.sampleRate;
        const originalDuration = channels[0].length / sampleRate;

        let processed = channels;

        if (options.trim !== false) {
            const opts = options.trim ?? {};
            const envRate = 100;

            const mono = mixToMono(channels);
            const env = computeRmsEnvelope(mono, sampleRate, envRate);

            let endSample = channels[0].length;
            let endSource = 'none';

            if (options.announcementRef && options.announcementRef.samples.length > 0) {
                const refEnv = computeRmsEnvelope(
                    options.announcementRef.samples,
                    options.announcementRef.sampleRate,
                    envRate,
                );

                const match = findAnnouncementInEnvelope(env, refEnv, envRate, sampleRate);

                if (match && match.score >= 0.7) {
                    const maxAcceptable = channels[0].length - Math.floor(1.0 * sampleRate);
                    if (match.sampleOffset < maxAcceptable) {
                        const bufferMs = match.score >= 0.85 ? 200 : 400;
                        endSample = Math.max(0, match.sampleOffset - Math.floor(bufferMs * sampleRate / 1000));
                        endSource = `announcement(score=${match.score.toFixed(2)})`;
                        console.log(
                            `[trim:end] announcement found @ ${(match.sampleOffset / sampleRate).toFixed(2)}s, ` +
                            `score ${match.score.toFixed(3)}, cut @ ${(endSample / sampleRate).toFixed(2)}s`
                        );
                    } else {
                        console.log(`[trim:end] announcement match too close to end, ignoring`);
                    }
                } else if (match) {
                    console.log(`[trim:end] weak announcement match (${match.score.toFixed(2)}), ignoring`);
                }
            }

            if (endSource === 'none') {
                const silenceCut = findEndSilenceSample(env, envRate, sampleRate, {
                    thresholdDb: opts.endSilenceThresholdDb ?? -40,
                    minSilenceMs: opts.endMinSilenceMs ?? 500,
                    maxSilenceKeepMs: opts.maxEndSilenceMs ?? 3000,
                    searchBackSec: opts.endSearchBackSec ?? 30,
                    endRatio: 1.0,
                });

                if (silenceCut !== null && silenceCut < channels[0].length) {
                    endSample = silenceCut;
                    endSource = 'silence';
                    console.log(`[trim:end] silence-based cut @ ${(endSample / sampleRate).toFixed(2)}s`);
                }
            }

            if (endSource === 'none') {
                console.log(`[trim:end] no end marker found — keeping full length`);
            }

            // const startSample = findStartSample(env, envRate, sampleRate, {
            //     thresholdDb: opts.startThresholdDb /* (?? opts.silenceThresholdDb) */ ?? -20,
            //     minSilenceMs: opts.minSilenceMs ?? 300,
            //     preTrimMs: opts.preTrimMs ?? 100,
            //     searchStartSec: opts.startSearchStartSec ?? 40,
            //     searchEndSec: opts.startSearchEndSec ?? 50,
            //     endRatio: endSample / channels[0].length,
            //     useDoubleAttack: opts.useDoubleAttack ?? true,
            //     useValidation: true
            // });

            const startSample = endSample - (119.35 * sampleRate);

            // const resultLen = endSample - startSample;
            const resultLen = endSample - (119.35 * sampleRate);
            if (resultLen > 1000 && resultLen < channels[0].length) {
                processed = channels.map(ch => ch.slice(startSample, endSample));

                applyFadeInOut(processed, (2.8 * sampleRate), (2.3 * sampleRate));

                const trimmedDuration = processed[0].length / sampleRate;
                console.log(
                    `Trim: ${originalDuration.toFixed(1)}s → ${trimmedDuration.toFixed(1)}s ` +
                    `(end: ${endSource}, start: ${(startSample / sampleRate).toFixed(2)}s)`
                );
            } else {
                console.warn(`Trim resulted in degenerate length, keeping original`);
            }
        }

        if (!options.stereo && processed.length > 1) {
            processed = [mixToMono(processed)];
        }

        // const blob = encodeWav(processed, sampleRate);
        
        events?.onStartEncoding?.();
        const blob = await encodeMp3WithID3(processed, sampleRate);
        events?.onEndEncoding?.();

        const folder = await requestCapturesFolder();
        if (!folder) throw new Error('Папка не выбрана');
        return saveCaptureToFolder(folder, blob, filename);
    }, [readLast]);

    return { attach, detach, readLast, saveToMp3 };
}


function mixToMono(channels: Float32Array[]): Float32Array {
    if (channels.length === 1) return channels[0];
    const len = channels[0].length;
    const mono = new Float32Array(len);
    for (let i = 0; i < len; i++) {
        let sum = 0;
        for (let ch = 0; ch < channels.length; ch++) sum += channels[ch][i];
        mono[i] = sum / channels.length;
    }
    return mono;
}

async function encodeMp3WithID3(input: Float32Array[], sampleRate: number): Promise<Blob> {
    const mp3 = await encodeMp3(input, sampleRate);

    const encoder = new AppeleyID3Encoder(3);

    const encodedID3 = encoder.encodeID3({
        trackN: 1,
        title: 'Advert: - Live365 - Advertisement',
        album: 'APPELEY Receiver Captures',
        artist: '{stationname} internet-radio station',

        additionalData: [
            {
                encoding: 'utf-8',
                key: 'CAPTURED_AT',
                value: new Date().toLocaleString()
            }
        ],
    }, 100);

    const fullMp3 = new Uint8Array(encodedID3.length + mp3.length);
    fullMp3.set(encodedID3, 0);
    fullMp3.set(mp3, encodedID3.length);
    
    return new Blob([fullMp3], { type: 'audio/mpeg' });
}


function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
    const numChannels = channels.length;
    const numSamples = channels[0].length;
    const dataSize = numSamples * numChannels * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const s = Math.max(-1, Math.min(1, channels[ch][i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}