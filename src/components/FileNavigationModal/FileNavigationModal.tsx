'use client';

import { createUSBFolder, enterUSBFolder, getUSBFiles, moveToParentUSBFolder, uploadFilesToUSBFolder, USBFlashInfo } from "@/app/actions";
import "./FileNavigationModal.css";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Dirent } from "fs";
import { getImageForDirEntry } from "@/utils/images";
import SimpleModal from "../UI/SimpleModal/SimpleModal";
import axios from "axios";
import AnimatedLoader from "../UI/AnimatedLoader/AnimatedLoader";

export interface FolderEntry {
    name: string;
    parentPath: string;
    isDirectory: boolean;
}

export default function FileNavigationModal({ selectedUSBData, onClose }: { selectedUSBData: USBFlashInfo; onClose?: () => void }) {

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [navigationData, setNavigationData] = useState<FolderEntry[]>([]);
    const [currentPath, setCurrentPath] = useState('/');

    const [openedModal, setOpenedModal] = useState<{
        type: 'new-folder',
    } | {
        type: 'upload-progress',
        current: number;
        total: number;
    } | null>(null);

    const [isUploading, setUploading] = useState(false);
    // const [progress, setProgress] = useState(0);

    const updateNavigationData = async () => {
        const res = await getUSBFiles(selectedUSBData.name, currentPath);

        if (res.success) {
            setNavigationData(res.data || []);
        }
    };

    const handleAddFolder = async (name: string) => {
        const res = await createUSBFolder(selectedUSBData.name, currentPath, name);

        if (res.success) {
            updateNavigationData();
            setOpenedModal(null);
        }
    }

    const handleEntryClick = async (ent: FolderEntry) => {
        if (!ent.isDirectory) return;

        const res = await enterUSBFolder(selectedUSBData.name, currentPath, ent.name);

        // alert(res.path)
        if (res.success && res.path && res.data) {
            setCurrentPath(res.path);
            setNavigationData(res.data);
        }
    }

    const handleMoveToPrevious = async () => {
        const res = await moveToParentUSBFolder(selectedUSBData.name, currentPath);

        // alert(res.path)
        if (res.success && res.path && res.data) {
            setCurrentPath(res.path);
            setNavigationData(res.data);
        }
    }

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {

            setUploading(true);

            const files = e.target.files;

            const formData = new FormData();

            for (const file of files) {
                formData.append(file.name, file);
            }

            const res = await axios.post(`/api/upload/files?usbName=${encodeURIComponent(selectedUSBData.name)}&path=${encodeURIComponent(currentPath)}`, formData, {
                onUploadProgress: (ev) => {
                    // setOpenedModal({
                    //     type: 'upload-progress',
                    //     current: ev.loaded || 0,
                    //     total: ev.total || 0,
                    // })
                    // const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    // setUploadProgress(percent);
                }
                
                // method: 'POST',
                // body: formData,
            });

            // const data = await res.json();

            if (res.data.success) {
                updateNavigationData();
            }

            setUploading(false);

            // const res = await uploadFilesToUSBFolder(selectedUSBData.name, currentPath, formData);

            // if (res.success && res.data) {
            //     setNavigationData(res.data);
            // }
        }
    }

    useEffect(() => {
        updateNavigationData();
    }, []);

    return (
        <div className="file-navigation-modal__overlay">
            <div className="file-navigation-modal">
                <div className="file-navigation-modal__top">
                    <button className="file-navigation-modal__button" onClick={handleMoveToPrevious}>⇑</button>
                    <input
                        type="text"
                        className="file-navigation-modal__input"
                        value={currentPath}
                        onChange={(e) => setCurrentPath(e.target.value)}
                    />
                    <button className="file-navigation-modal__button" onClick={() => setOpenedModal({
                        type: 'new-folder'
                    })}>+</button>
                </div>
                <div className="file-navigation-modal__content">
                    {navigationData.map(ent => (
                        <div className="file-navigation-entry" onClick={() => handleEntryClick(ent)}>
                            <div className="file-navigation-entry__left">
                                <img src={getImageForDirEntry(ent)} className="file-navigation-entry__image" />
                                <span className="file-navigation-entry__name">{ent.name}</span>
                            </div>
                            <div className="file-navigation-entry__right"></div>
                        </div>
                    ))}
                </div>
                <div className="file-navigation-modal__buttons">
                    <button className="file-navigation-modal__button" onClick={() => fileInputRef.current?.click()}>Загрузить файлы</button>
                    <button className="file-navigation-modal__button">Загрузить папку</button>
                    <button className="file-navigation-modal__button" onClick={onClose}>Выйти из файлового менеджера</button>

                    <input type="file" hidden onChange={handleFileUpload} multiple ref={fileInputRef} accept="audio/*" />
                </div>
            </div>

            {openedModal && (
                openedModal.type === 'new-folder' ? (
                    <SimpleModal
                        type="prompt"
                        title="Создать папку"
                        message="Введите имя новой папки:"

                        onConfirm={handleAddFolder}
                        onCancel={() => setOpenedModal(null)}
                    />
                ) : (
                    <></>
                )
            )}

            {isUploading && (
                <div className="upload-modal">
                    <AnimatedLoader styles={{ scale: 6 }} />
                </div>
            )}
        </div>
    );
}