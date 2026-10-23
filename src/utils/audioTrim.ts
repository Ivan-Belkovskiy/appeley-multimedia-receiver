
export function computeRmsEnvelope(
    mono: Float32Array,
    sampleRate: number,
    envRate: number = 100,
): Float32Array {
    const windowSamples = Math.floor(sampleRate / envRate);
    const numWindows = Math.floor(mono.length / windowSamples);
    const env = new Float32Array(numWindows);

    for (let w = 0; w < numWindows; w++) {
        let sumSq = 0;
        const start = w * windowSamples;
        for (let i = 0; i < windowSamples; i++) {
            sumSq += mono[start + i] * mono[start + i];
        }
        env[w] = Math.sqrt(sumSq / windowSamples);
    }
    return env;
}

export function findAnnouncementInEnvelope(
    captureEnv: Float32Array,
    refEnv: Float32Array,
    envRate: number,
    audioSampleRate: number,
): { envOffset: number; sampleOffset: number; score: number } | null {
    const N = refEnv.length;
    const M = captureEnv.length;
    if (M < N + 10 || N < 10) return null;

    const refMean = meanOf(refEnv);
    let refVar = 0;
    for (let i = 0; i < N; i++) refVar += (refEnv[i] - refMean) ** 2;
    const refStd = Math.sqrt(refVar / N);
    if (refStd < 1e-6) return null;

    const refNorm = new Float32Array(N);
    for (let i = 0; i < N; i++) refNorm[i] = (refEnv[i] - refMean) / refStd;

    let capSum = 0;
    let capSqRawSum = 0;
    for (let i = 0; i < N; i++) {
        const v = captureEnv[i];
        capSum += v;
        capSqRawSum += v * v;
    }

    let bestScore = -1;
    let bestOffset = -1;

    for (let offset = 0; offset + N <= M; offset++) {
        if (offset > 0) {
            const removed = captureEnv[offset - 1];
            const added = captureEnv[offset + N - 1];
            capSum = capSum - removed + added;
            capSqRawSum = capSqRawSum - removed * removed + added * added;
        }

        const capMean = capSum / N;
        const capVar = (capSqRawSum / N) - capMean * capMean;
        const capStd = capVar > 0 ? Math.sqrt(capVar) : 0;
        if (capStd < 1e-6) continue;

        let dot = 0;
        for (let i = 0; i < N; i++) dot += refNorm[i] * captureEnv[offset + i];

        const score = dot / (N * capStd);

        if (score > bestScore) {
            bestScore = score;
            bestOffset = offset;
        }
    }

    if (bestOffset < 0 || bestScore < 0.5) return null;

    const sampleOffset = Math.floor((bestOffset / envRate) * audioSampleRate);
    return { envOffset: bestOffset, sampleOffset, score: bestScore };
}

function meanOf(arr: Float32Array): number {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
}

export function findEndSilenceSample(
    env: Float32Array,
    envRate: number,
    audioSampleRate: number,
    options: {
        thresholdDb: number;
        minSilenceMs: number;
        maxSilenceKeepMs: number;
        searchBackSec: number;
        endRatio: number;
    },
): number | null {
    const {
        thresholdDb,
        minSilenceMs,
        maxSilenceKeepMs,
        searchBackSec,
        endRatio,
    } = options;

    const threshold = Math.pow(10, thresholdDb / 20);

    const nonZero: number[] = [];
    for (let i = 0; i < env.length; i++) if (env[i] > 1e-4) nonZero.push(env[i]);
    nonZero.sort((a, b) => a - b);
    const median = nonZero.length > 0 ? nonZero[Math.floor(nonZero.length / 2)] : 0.01;
    const effectiveThreshold = Math.max(threshold, median * 0.05);

    const isSilent = (i: number) => env[i] < effectiveThreshold;

    const endIdx = Math.floor(env.length * endRatio);
    const searchStartIdx = Math.max(0, endIdx - Math.floor(searchBackSec * envRate));

    const minSilenceWindows = Math.ceil(minSilenceMs / (1000 / envRate));
    const maxKeepWindows = Math.ceil(maxSilenceKeepMs / (1000 / envRate));

    for (let w = endIdx - 1; w >= searchStartIdx; w--) {
        if (isSilent(w) && (w === 0 || !isSilent(w - 1))) {
            let len = 0;
            for (let k = w; k < endIdx && isSilent(k); k++) len++;

            if (len >= minSilenceWindows) {
                const keep = Math.min(len, maxKeepWindows);
                const cutIdx = w + keep;
                return Math.floor((cutIdx / envRate) * audioSampleRate);
            }
        }
    }

    return null;
}

export function findStartSample(
    env: Float32Array,
    envRate: number,
    audioSampleRate: number,
    options: {
        thresholdDb: number;
        minSilenceMs: number;
        preTrimMs: number;
        searchStartSec: number;
        searchEndSec: number;
        endRatio: number;
        useDoubleAttack?: boolean;
        useValidation?: boolean;
    },
): number {
    const {
        thresholdDb,
        minSilenceMs,
        preTrimMs,
        searchStartSec,
        searchEndSec,
        endRatio,
        useDoubleAttack = true,
        useValidation = false,
    } = options;

    const threshold = Math.pow(10, thresholdDb / 20);
    const minSilenceWindows = Math.ceil(minSilenceMs / (1000 / envRate));
    const preTrimWindows = Math.ceil(preTrimMs / (1000 / envRate));

    const totalWindows = Math.floor(env.length * endRatio);
    const startRangeStart = Math.max(0, Math.floor(searchStartSec * envRate));
    const startRangeEnd = Math.min(totalWindows, Math.floor(searchEndSec * envRate));

    const isLoud = (i: number) => env[i] >= threshold;
    const isSilent = (i: number) => env[i] < threshold;

    let baseStartWindow = 0;
    for (let w = startRangeStart; w < startRangeEnd; w++) {
        if (isLoud(w)) {
            let silentCount = 0;
            for (let k = w - 1; k >= 0 && silentCount < minSilenceWindows; k--) {
                if (isSilent(k)) silentCount++;
                else break;
            }
            if (silentCount >= minSilenceWindows) {
                baseStartWindow = Math.max(0, w - preTrimWindows);
                break;
            }
        }
    }

    let startWindow = baseStartWindow;

    if (useValidation) {
        const validationEnd = Math.min(totalWindows, startWindow + 60 * envRate);
        let loudCount = 0;
        for (let k = startWindow; k < validationEnd; k++) {
            if (isLoud(k)) loudCount++;
        }
        const loudRatio = loudCount / (validationEnd - startWindow);

        if (loudRatio < 0.7) {
            console.log(`[trim:start] candidate @ ${(startWindow / envRate).toFixed(1)}s rejected ` +
                `(only ${(loudRatio * 100).toFixed(0)}% loud after)`);
            startWindow = 0; 
        }
    }

    if (useDoubleAttack) {
        const pauseMinWindows = Math.ceil(50 / (1000 / envRate));
        const pauseMaxWindows = Math.ceil(300 / (1000 / envRate));

        const searchFrom = Math.max(0, baseStartWindow - Math.ceil(200 / (1000 / envRate)));
        const searchTo = Math.min(totalWindows, baseStartWindow + Math.ceil(600 / (1000 / envRate)));

        for (let w = searchFrom; w < searchTo; w++) {
            if (isSilent(w)) {
                let len = 0;
                for (let k = w; k < searchTo && isSilent(k); k++) len++;

                if (len >= pauseMinWindows && len <= pauseMaxWindows) {
                    const beforeIdx = w - 1;
                    const afterIdx = w + len;
                    if (beforeIdx >= 0 && afterIdx < totalWindows && isLoud(beforeIdx) && isLoud(afterIdx)) {
                        const preRollWindows = Math.ceil(400 / (1000 / envRate));
                        const newStart = Math.max(0, w - preRollWindows - Math.ceil(100 / (1000 / envRate)));
                        if (newStart < startWindow) {
                            startWindow = newStart;
                            console.log(
                                `[trim:start] double-attack detected: pause @ ${(w / envRate).toFixed(2)}s, ` +
                                `shift start to ${(newStart / envRate).toFixed(2)}s`
                            );
                        }
                        break;
                    }
                }
            }
        }
    }

    return Math.floor((startWindow / envRate) * audioSampleRate);
}