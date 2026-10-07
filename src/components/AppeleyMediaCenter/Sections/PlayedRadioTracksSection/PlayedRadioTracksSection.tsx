'use client';

import { getPlayedRadioTracks, PlayedRadioTrack } from "@/app/actions";
import AnimatedLoader from "@/components/UI/AnimatedLoader/AnimatedLoader";
import { useEffect, useState } from "react";
import { useMusicDownloader, DownloadItem } from "@/hooks/useMusicDownloader";

import "./PlayedRadioTracksSection.css";

export default function PlayedRadioTracksSection() {
    const [tracklist, setTracklist] = useState<PlayedRadioTrack[]>([]);
    const [isLoading, setLoading] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const {
        queue, isProcessing,
        folderName, globalError,
        addToQueue, removeItem, clearDone,
        processQueue, changeFolder, clearError,
    } = useMusicDownloader();

    const getTracklist = async () => {
        setLoading(true);
        const res = await getPlayedRadioTracks();
        if (res.success && res.data) setTracklist(res.data);
        setLoading(false);
    };

    useEffect(() => { getTracklist(); }, []);

    const isAdvert = (title: string) => title.startsWith('Advert: ');

    const handleAddOne = (tr: PlayedRadioTrack) => {
        addToQueue({
            id: tr.id,
            title: tr.title,
            isAdvert: isAdvert(tr.title),
        });
        setShowQueue(true);
    };

    const handleAddSelected = () => {
        const tracksToAdd = tracklist.filter(tr => selectedIds.has(tr.id));
        for (const tr of tracksToAdd) {
            addToQueue({
                id: tr.id,
                title: tr.title,
                isAdvert: isAdvert(tr.title),
            });
        }
        setShowQueue(true);
    };

    const handleAddAll = () => {
        for (const tr of tracklist) {
            if (isAdvert(tr.title)) continue;
            addToQueue({
                id: tr.id,
                title: tr.title,
                isAdvert: false,
            });
        }
        setShowQueue(true);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const pendingCount = queue.filter(i => i.status === 'PENDING').length;

    return (
        <div className="appeley-media-center-section">
            <h1 className="appeley-media-center-section__title radio-stations-section__title">
                Воспроизведенные треки интернет-радио
            </h1>

            <div className="played-tracklist-toolbar">
                <button
                    className="played-tracklist-toolbar__button"
                    onClick={handleAddSelected}
                    disabled={selectedIds.size === 0}
                >
                    Скачать выбранные ({selectedIds.size})
                </button>
                <button
                    className="played-tracklist-toolbar__button"
                    onClick={handleAddAll}
                    disabled={tracklist.length === 0}
                >
                    Скачать все (кроме Advert)
                </button>
                <button
                    className="played-tracklist-toolbar__button"
                    onClick={changeFolder}
                    title={folderName ?? 'Папка не выбрана'}
                >
                    📁 {folderName ?? 'Выбрать папку'}
                </button>
                <button
                    className="played-tracklist-toolbar__button"
                    onClick={() => setShowQueue(v => !v)}
                >
                    Очередь ({queue.length}){pendingCount > 0 ? ` • ${pendingCount}` : ''}
                </button>
            </div>

            <div className="played-track-table-container">
                <table className="played-track-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Радиостанция</th>
                            <th>Название трека</th>
                            <th>Дата</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tracklist.map(tr => {
                            const advert = isAdvert(tr.title);
                            const inQueue = queue.some(i => i.radioTrackId === tr.id);
                            return (
                                <tr key={tr.id} className={advert ? 'advert-row' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(tr.id)}
                                            onChange={() => toggleSelect(tr.id)}
                                            disabled={advert}
                                        />
                                    </td>
                                    <td className="radio-station">{tr.station.name}</td>
                                    <td>
                                        {advert ? (
                                            <span className="advert-badge">ADVERT</span>
                                        ) : null}
                                        {tr.title}
                                    </td>
                                    <td>{new Date(tr.loaded_at).toLocaleString()}</td>
                                    <td>
                                        {advert ? (
                                            <button
                                                className="played-track__button"
                                                disabled
                                                title="Advert-треки обрабатываются через Capture в ресивере"
                                            >
                                                Захватить →
                                            </button>
                                        ) : (
                                            <button
                                                className="played-track__button"
                                                onClick={() => handleAddOne(tr)}
                                                disabled={inQueue}
                                            >
                                                {inQueue ? 'В очереди' : 'Скачать'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="played-tracklist-details">
                <div className="played-tracklist-details__infobox">
                    <span className="played-tracklist-details__label">Всего треков:</span>
                    <span className="played-tracklist-details__label value">{tracklist.length}</span>
                </div>
                <div className="played-tracklist-details__infobox">
                    <span className="played-tracklist-details__label">Advert-треков:</span>
                    <span className="played-tracklist-details__label value">
                        {tracklist.filter(tr => isAdvert(tr.title)).length}
                    </span>
                </div>
            </div>

            {showQueue && queue.length > 0 && (
                <div className="download-queue">
                    <div className="download-queue__header">
                        <h3>Очередь скачивания ({queue.length})</h3>
                        <div>
                            <button
                                onClick={processQueue}
                                disabled={isProcessing || pendingCount === 0}
                            >
                                {isProcessing ? 'Обработка...' : `Начать обработку (${pendingCount})`}
                            </button>
                            <button onClick={clearDone}>Очистить завершённые</button>
                        </div>
                    </div>
                    <div className="download-queue__list">
                        {queue.map(item => (
                            <div key={item.id} className={`download-queue__item status-${item.status.toLowerCase()}`}>
                                <div className="download-queue__item-left">
                                    <span className="download-queue__item-title">
                                        {item.result
                                            ? `${item.result.artist} — ${item.result.title}`
                                            : `${item.artist} — ${item.title}`}
                                    </span>
                                    <span className="download-queue__item-status">
                                        {getStatusLabel(item.status)}
                                        {item.error ? ` — ${item.error}` : ''}
                                    </span>
                                    {(item.status === 'DOWNLOADING' || item.status === 'SEARCHING') && (
                                        <div className="download-queue__progress">
                                            <div
                                                className="download-queue__progress-fill"
                                                style={{ width: `${Math.round(item.progress * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    {item.savedTo && (
                                        <span className="download-queue__saved">
                                            📁 {item.savedTo.folderName} / {item.savedTo.fileName}
                                            {' '}({(item.savedTo.sizeBytes / 1024).toFixed(0)} KB)
                                        </span>
                                    )}
                                </div>
                                <button onClick={() => removeItem(item.id)}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="loading-overlay">
                    <AnimatedLoader styles={{ scale: 5 }} />
                </div>
            )}
        </div>
    );
}

function getStatusLabel(status: DownloadItem['status']): string {
    switch (status) {
        case 'PENDING': return '⏳ Ожидание';
        case 'SEARCHING': return '🔍 Поиск';
        case 'DOWNLOADING': return '⬇️ Скачивание';
        case 'PROCESSING': return '🏷️ Запись ID3-тегов';
        case 'SAVING': return '💾 Сохранение';
        case 'DONE': return '✅ Завершено';
        case 'NOT_FOUND': return '❌ Не найдено';
        case 'FAILED': return '⚠️ Ошибка';
    }
}