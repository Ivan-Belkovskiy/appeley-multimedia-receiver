'use client';

import { createUSBFolder, enterUSBFolder, getUSBFiles, moveToParentUSBFolder, USBFlashInfo } from "@/app/actions";
import "./FileNavigationModal.css";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { getImageForDirEntry } from "@/utils/images";
import SimpleModal from "../UI/SimpleModal/SimpleModal";
import AnimatedLoader from "../UI/AnimatedLoader/AnimatedLoader";
import { upload } from "@vercel/blob/client";

export interface FolderEntry {
    name: string;
    isDirectory: boolean;
}

const ACCEPTED_MIME_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/x-ms-wma",
    "video/mp4",
];

const ACCEPT_ATTRIBUTE = "audio/mpeg,audio/wav,audio/x-ms-wma,video/mp4,.mp3,.wav,.wma,.mp4";

export default function FileNavigationModal({
    selectedUSBData,
    onClose,
}: {
    selectedUSBData: USBFlashInfo;
    onClose?: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [navigationData, setNavigationData] = useState<FolderEntry[]>([]);
    const [currentPath, setCurrentPath] = useState("/");

    const [openedModal, setOpenedModal] = useState<{
        type: "new-folder";
    } | null>(null);

    const [uploadState, setUploadState] = useState<{
        currentFile: string;
        currentIndex: number;
        totalFiles: number;
        percent: number;
    } | null>(null);

    const updateNavigationData = async () => {
        if (!selectedUSBData.id) return;
        const res = await getUSBFiles(selectedUSBData.id, currentPath);
        if (res.success) {
            setNavigationData(res.data || []);
        }
    };

    const handleAddFolder = async (name: string) => {
        if (!selectedUSBData.id) return;
        const res = await createUSBFolder(selectedUSBData.id, currentPath, name);
        if (res.success) {
            updateNavigationData();
            setOpenedModal(null);
        }
    };

    const handleEntryClick = async (ent: FolderEntry) => {
        if (!selectedUSBData.id || !ent.isDirectory) return;

        const res = await enterUSBFolder(selectedUSBData.id, currentPath, ent.name);

        if (res.success && res.path && res.data) {
            setCurrentPath(res.path);
            setNavigationData(res.data);
        }
    };

    const handleMoveToPrevious = async () => {
        if (!selectedUSBData.id) return;

        const res = await moveToParentUSBFolder(selectedUSBData.id, currentPath);

        if (res.success && res.path && res.data) {
            setCurrentPath(res.path);
            setNavigationData(res.data);
        }
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !selectedUSBData.id) return;

        const files = Array.from(e.target.files);

        e.target.value = "";

        const cleanPath = currentPath.replace(/^\/+|\/+$/g, "");
        const prefix = cleanPath
            ? `USB${selectedUSBData.id}/${cleanPath}/`
            : `USB${selectedUSBData.id}/`;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (file.type && !ACCEPTED_MIME_TYPES.includes(file.type)) {
                console.warn(`Пропущен неподдерживаемый тип: ${file.type} (${file.name})`);
                continue;
            }

            const safeName = file.name.replace(/[/\\]/g, "_");

            setUploadState({
                currentFile: safeName,
                currentIndex: i + 1,
                totalFiles: files.length,
                percent: 0,
            });

            try {
                await upload(`${prefix}${safeName}`, file, {
                    access: "public",
                    handleUploadUrl: "/api/upload/files",
                    contentType: file.type || "application/octet-stream",
                    onUploadProgress: ({ percentage }) => {
                        setUploadState((prev) =>
                            prev ? { ...prev, percent: Math.round(percentage) } : prev
                        );
                    },
                });
            } catch (err) {
                console.error(`Ошибка загрузки "${safeName}":`, err);
            }
        }

        setUploadState(null);
        await updateNavigationData();
    };

    useEffect(() => {
        updateNavigationData();
    }, []);

    return (
        <div className="file-navigation-modal__overlay">
            <div className="file-navigation-modal">
                <div className="file-navigation-modal__top">
                    <button
                        className="file-navigation-modal__button"
                        onClick={handleMoveToPrevious}
                    >
                        ⇑
                    </button>
                    <input
                        type="text"
                        className="file-navigation-modal__input"
                        value={currentPath}
                        onChange={(e) => setCurrentPath(e.target.value)}
                    />
                    <button
                        className="file-navigation-modal__button"
                        onClick={() => setOpenedModal({ type: "new-folder" })}
                    >
                        +
                    </button>
                </div>

                <div className="file-navigation-modal__content">
                    {navigationData.map((ent) => (
                        <div
                            key={ent.name}
                            className="file-navigation-entry"
                            onClick={() => handleEntryClick(ent)}
                        >
                            <div className="file-navigation-entry__left">
                                <img
                                    src={getImageForDirEntry(ent)}
                                    className="file-navigation-entry__image"
                                    alt={ent.name}
                                />
                                <span className="file-navigation-entry__name">
                                    {ent.name}
                                </span>
                            </div>
                            <div className="file-navigation-entry__right"></div>
                        </div>
                    ))}
                </div>

                <div className="file-navigation-modal__buttons">
                    <button
                        className="file-navigation-modal__button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!!uploadState}
                    >
                        Загрузить файлы
                    </button>
                    <button className="file-navigation-modal__button">
                        Загрузить папку
                    </button>
                    <button
                        className="file-navigation-modal__button"
                        onClick={onClose}
                    >
                        Выйти из файлового менеджера
                    </button>

                    <input
                        type="file"
                        hidden
                        onChange={handleFileUpload}
                        multiple
                        ref={fileInputRef}
                        accept={ACCEPT_ATTRIBUTE}
                    />
                </div>
            </div>

            {openedModal?.type === "new-folder" && (
                <SimpleModal
                    type="prompt"
                    title="Создать папку"
                    message="Введите имя новой папки:"
                    onConfirm={handleAddFolder}
                    onCancel={() => setOpenedModal(null)}
                />
            )}

            {uploadState && (
                <div className="upload-modal">
                    <div className="upload-modal__content">
                        <AnimatedLoader styles={{ scale: 6 }} />
                        <div className="upload-modal__info">
                            <span className="upload-modal__file">
                                {uploadState.currentFile}
                            </span>
                            <span className="upload-modal__counter">
                                Файл {uploadState.currentIndex} из {uploadState.totalFiles}
                            </span>
                            <div className="upload-modal__progress-bar">
                                <div
                                    className="upload-modal__progress-fill"
                                    style={{ width: `${uploadState.percent}%` }}
                                />
                            </div>
                            <span className="upload-modal__percent">
                                {uploadState.percent}%
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}