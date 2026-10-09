'use client';

import { useState } from 'react';
import { useRadioCapture } from '@/hooks/useRadioCapture';
import { useCaptureSettings } from '@/hooks/useCaptureSettings';
import './RadioCaptureDetectionSection.css';
import { requestCapturesFolder } from '@/utils/captureStorage';
import AnimatedLoader from '@/components/UI/AnimatedLoader/AnimatedLoader';

export default function RadioCaptureDetectionSection() {
    const { settings, update, loading } = useCaptureSettings();
    const { capture, cancelCapture } = useRadioCapture();

    const [status, setStatus] = useState<
        | { type: 'idle' }
        | { type: 'capturing'; progress: number; startedAt: number }
        | { type: 'saving' }
        | { type: 'done'; hash: string; savedTo?: any; blob: Blob }
        | { type: 'error'; message: string }
    >({ type: 'idle' });

    const [manualUrl, setManualUrl] = useState('');
    const [manualDuration, setManualDuration] = useState(30);

    if (loading || !settings) return  (
                    <div className="loading-overlay">
                        <AnimatedLoader styles={{ scale: 5 }} />
                    </div>
                );

    const handleCapture = async (stationUrl: string, durationSec: number) => {
        try {
            setStatus({ type: 'capturing', progress: 0, startedAt: Date.now() });

            await requestCapturesFolder();

            const result = await capture(stationUrl, durationSec * 1000, {
                saveLocally: settings.storageType === 'local' || settings.storageType === 'all',
                filename: `capture_${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`,
                onProgress: (p) => setStatus(s => s.type === 'capturing'
                    ? { ...s, progress: p }
                    : s
                ),
            });

            setStatus({
                type: 'done',
                hash: result.hash,
                savedTo: result.savedTo,
                blob: result.blob,
            });
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message ?? String(err) });
        }
    };

    return (
        <div className="appeley-media-center-section">
            <h1 className="appeley-media-center-section__title">Захват и распознавание аудио</h1>

            <div className="capture-settings">
                <h2 className="capture-settings__title">Настройки захвата</h2>

                <div className="capture-settings__row">
                    <span className="capture-settings__label">Место сохранения:</span>
                    <select
                        value={settings.storageType}
                        onChange={e => update({ storageType: e.target.value as any })}
                        className='capture-settings__input'
                    >
                        <option value="local">Локальная папка (File System Access)</option>
                        <option value="vercel_blob">Vercel Blob</option>
                        <option value="electron">Electron-клиент (если запущен)</option>
                        <option value="all">Все сразу</option>
                    </select>
                </div>

                <div className="capture-settings__row">
                    <span className="capture-settings__label">Длительность:</span>
                    <input
                        type="number"
                        min={10}
                        max={120}
                        value={settings.captureDurationMs / 1000}
                        onChange={e => update({ captureDurationMs: Number(e.target.value) * 1000 })}
                        className='capture-settings__input'
                    />
                    <span>сек</span>
                </div>

                <div className="capture-settings__row">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.autoCaptureAdvert}
                            onChange={e => update({ autoCaptureAdvert: e.target.checked })}
                            className='capture-settings__input'
                        />
                        Автозахват при «Advert:» в метаданных
                    </label>
                </div>

                <div className="capture-settings__row">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.aiRecognitionEnabled}
                            onChange={e => update({ aiRecognitionEnabled: e.target.checked })}
                            className='capture-settings__input'
                        />
                        Распознавать через ИИ
                    </label>
                </div>
            </div>

            <div className="capture-manual">
                <h2 className="capture-manual__title">Ручной захват</h2>

                <div className="capture-manual__row">
                    <input
                        type="text"
                        placeholder="URL радиостанции"
                        value={manualUrl}
                        onChange={e => setManualUrl(e.target.value)}
                        className="capture-manual__input"
                    />
                    <input
                        type="number"
                        min={10}
                        max={120}
                        value={manualDuration}
                        onChange={e => setManualDuration(Number(e.target.value))}
                        className="capture-manual__duration"
                    />
                    <span>сек</span>
                    <button
                        onClick={() => handleCapture(manualUrl, manualDuration)}
                        disabled={!manualUrl || status.type === 'capturing'}
                    >
                        Захватить
                    </button>
                </div>
            </div>

            <div className="capture-status">
                {status.type === 'idle' && <span>Готов к захвату</span>}

                {status.type === 'capturing' && (
                    <>
                        <span>🎙️ Захват... {Math.round(status.progress * 100)}%</span>
                        <div className="capture-status__progress">
                            <div
                                className="capture-status__progress-fill"
                                style={{ width: `${status.progress * 100}%` }}
                            />
                        </div>
                        <button onClick={cancelCapture}>Отменить</button>
                    </>
                )}

                {status.type === 'done' && (
                    <>
                        <span>✅ Захвачено: {status.hash.slice(0, 12)}...</span>
                        {status.savedTo && (
                            <span>
                                📁 Сохранено: <b>{status.savedTo.folderName}</b> / {status.savedTo.fileName}
                                {' '}({(status.savedTo.sizeBytes / 1024).toFixed(1)} KB)
                            </span>
                        )}
                        <audio
                            src={URL.createObjectURL(status.blob)}
                            controls
                            style={{ width: '100%', marginTop: 8 }}
                        />
                    </>
                )}

                {status.type === 'error' && (
                    <span style={{ color: 'red' }}>❌ Ошибка: {status.message}</span>
                )}
            </div>
        </div>
    );
}