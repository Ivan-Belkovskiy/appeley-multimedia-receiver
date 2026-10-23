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



    const saveWav = useCallback(async (
        seconds: number,
        filename: string,
        options: SaveOptions = {},
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

            const startSample = findStartSample(env, envRate, sampleRate, {
                thresholdDb: opts.startThresholdDb /* (?? opts.silenceThresholdDb) */ ?? -20,
                minSilenceMs: opts.minSilenceMs ?? 300,
                preTrimMs: opts.preTrimMs ?? 100,
                searchStartSec: opts.startSearchStartSec ?? 40,
                searchEndSec: opts.startSearchEndSec ?? 50,
                endRatio: endSample / channels[0].length,
                useDoubleAttack: opts.useDoubleAttack ?? true,
                useValidation: true
            });

            const resultLen = endSample - startSample;
            if (resultLen > 1000 && resultLen < channels[0].length) {
                processed = channels.map(ch => ch.slice(startSample, endSample));
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

        const blob = encodeWav(processed, sampleRate);
        const folder = await requestCapturesFolder();
        if (!folder) throw new Error('Папка не выбрана');
        return saveCaptureToFolder(folder, blob, filename);
    }, [readLast]);

    return { attach, detach, readLast, saveWav };
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

// function trimBySilence(
//     channels: Float32Array[],
//     sampleRate: number,
//     options: TrimOptions = {},
// ): Float32Array[] {
//     const {
//         // silenceThresholdDb = -40,
//         minSilenceMs = 300,
//         preTrimMs = 100,
//         postTrimMs = 300,
//         startSearchStartSec = 20,
//         startSearchEndSec = 60,
//         endSearchBackSec = 20,
//     } = options;

//     const mono = mixToMono(channels);
//     const windowSize = Math.floor(sampleRate * 0.05);
//     const numWindows = Math.floor(mono.length / windowSize);

//     if (numWindows < 20) return channels;

//     const rms = new Float32Array(numWindows);
//     for (let w = 0; w < numWindows; w++) {
//         let sumSq = 0;
//         const start = w * windowSize;
//         for (let i = 0; i < windowSize; i++) sumSq += mono[start + i] * mono[start + i];
//         rms[w] = Math.sqrt(sumSq / windowSize);
//     }

//     const nonZero = Array.from(rms).filter(v => v > 0.0001).sort((a, b) => a - b);
//     const median = nonZero.length > 0 ? nonZero[Math.floor(nonZero.length / 2)] : 0.01;
//     const threshold = Math.max(Math.pow(10, silenceThresholdDb / 20), median * 0.1);

//     const isSilent = Array.from(rms).map(r => r < threshold);
//     const minSilenceWindows = Math.ceil(minSilenceMs / 50);
//     const preTrimWindows = Math.ceil(preTrimMs / 50);
//     const postTrimWindows = Math.ceil(postTrimMs / 50);

//     let startWindow = 0;
//     const startRangeStart = Math.max(0, Math.floor(startSearchStartSec * 1000 / 50));
//     const startRangeEnd = Math.min(numWindows, Math.floor(startSearchEndSec * 1000 / 50));

//     for (let w = startRangeStart; w < startRangeEnd; w++) {
//         if (!isSilent[w]) {
//             let silentCount = 0;
//             for (let k = w - 1; k >= 0 && silentCount < minSilenceWindows; k--) {
//                 if (isSilent[k]) silentCount++;
//                 else break;
//             }
//             if (silentCount >= minSilenceWindows) {
//                 startWindow = Math.max(0, w - preTrimWindows);
//                 break;
//             }
//         }
//     }

//     let endWindow = numWindows;
//     const endRangeStart = Math.floor(numWindows - Math.ceil(endSearchBackSec * 1000 / 50));

//     for (let w = numWindows - minSilenceWindows - 1; w >= endRangeStart; w--) {
//         if (!isSilent[w]) {
//             let silentCount = 0;
//             for (let k = w + 1; k < numWindows && silentCount < minSilenceWindows; k++) {
//                 if (isSilent[k]) silentCount++;
//                 else break;
//             }
//             if (silentCount >= minSilenceWindows) {
//                 endWindow = Math.min(numWindows, w + postTrimWindows);
//                 break;
//             }
//         }
//     }

//     const resultWindows = endWindow - startWindow;

//     if (
//         resultWindows < minSilenceWindows ||
//         resultWindows > numWindows * 0.95
//     ) {
//         console.warn('Trim failed — silence detection not confident, keeping original');
//         return channels;
//     }

//     const startSample = startWindow * windowSize;
//     const endSample = endWindow * windowSize;

//     return channels.map(ch => ch.slice(startSample, endSample));
// }

function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
    const numChannels = channels.length;
    const numSamples = channels[0].length;
    const dataSize = numSamples * numChannels * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, 'data');
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

function writeAscii(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}