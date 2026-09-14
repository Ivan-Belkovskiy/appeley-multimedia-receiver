'use client';

import { deleteUSBFlash, getUSBData, USBFlashInfo } from "@/app/actions";
import "./USBSelectModal.css";
import { useEffect, useState } from "react";
import USBCreateModal from "../USBCreateModal/USBCreateModal";
import FileNavigationModal from "../FileNavigationModal/FileNavigationModal";

export default function USBSelectModal({ connectedDevice, onSelect, onClose }: { connectedDevice?: USBFlashInfo; onSelect?: (usbData: USBFlashInfo) => void; onClose?: () => void }) {

    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState<USBFlashInfo[]>([]);

    const [isModalOpened, setModalOpened] = useState(false);
    const [isFileManagerOpened, setFileManagerOpened] = useState(false);

    const [selectedData, setSelectedData] = useState<USBFlashInfo | null>(null);

    const [updated, setUpdated] = useState(false);

    const [connected, setConnected] = useState<USBFlashInfo | undefined>(connectedDevice);

    useEffect(() => setConnected(connectedDevice), [connectedDevice]);

    const updateState = () => {
        setUpdated(true);
    }

    const loadUsbData = async () => {
        setLoading(true);

        const res = await getUSBData();
        if (res.success && res.data) {
            setData(res.data || []);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadUsbData();
    }, []);

    // useEffect(() => {
    //     setUpdated(false);
    // }, [updated]);

    const handleDelete = async (id?: number) => {
        if (!id) return;
        const res = await deleteUSBFlash(id);

        if (res.success && res.data) {
            setData(res.data);
        }

    }

    async function* getFilesRecursively(entry: any): any {
        if (entry.kind === "file") {
            const file = await entry.getFile();
            if (file !== null) {
                // file.relativePath = getRelativePath(entry);
                yield file;
            }
        } else if (entry.kind === "directory") {
            for await (const handle of entry.values()) {
                yield* getFilesRecursively(handle);
            }
        }
    }

    // for await (const fileHandle of getFilesRecursively(directoryHandle)) {
    //     console.log(fileHandle);
    // }

    const handleDeviceConnect = async () => {
        if (typeof window === 'undefined') return;

        if (!('showDirectoryPicker' in window)) {
            alert('Ваш браузер не поддерживает выбор папки. Используйте Chrome, Edge или Opera.');
            return;
        }

        try {
            const directoryHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
                mode: 'read',
            });

            const permission = await (directoryHandle as any).queryPermission({ mode: 'read' });
            if (permission !== 'granted') {
                const requested = await (directoryHandle as any).requestPermission({ mode: 'read' });
                if (requested !== 'granted') {
                    alert('Разрешение на чтение папки не получено');
                    return;
                }
            }

            const localUSB: USBFlashInfo = {
                kind: 'local',
                name: directoryHandle.name,
                style: {
                    primaryColor: '#0088ff',
                    secondaryColor: '#00eeff',
                },
                directoryHandle,
            };

            onSelect?.(localUSB);
            setConnected(localUSB);
            onClose?.();

            console.log('✅ Локальная папка подключена:', directoryHandle.name);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Ошибка выбора папки:', err);
            alert(`Ошибка: ${err.message}`);
        }
    };

    if (!updated) return (
        <div className="usb-select-modal__overlay">
            <div className="usb-select-modal">
                <h1 className="usb-select-modal__title">Выберите устройство для подключения</h1>
                <div className="usb-select-modal__content">{
                    isLoading ? (
                        <span className="usb-select-modal__message">Загрузка данных...</span>
                    ) : (
                        <>
                            {data.length === 0 ? (
                                <span className="usb-select-modal__message">USB-накопители отсутствуют!</span>
                            ) : data.map(usb => (
                                <div className="usb-flash-data">
                                    <div className="usb-flash-data__left">
                                        <div className="usb-flash-data__preview">
                                            <svg version="1.1"
                                                xmlns="http://www.w3.org/2000/svg"
                                                xmlnsXlink="http://www.w3.org/1999/xlink" width="113.72373" height="42.16474" viewBox="0,0,113.72373,42.16474">
                                                <g transform="translate(-193.04932,-158.91763)">
                                                    <g strokeMiterlimit="10">
                                                        <path d="M282.94139,192.93416v-25.86831h22.58166v25.86831z" fill={usb.style.primaryColor} stroke="#000000" strokeWidth="2.5" />
                                                        <path d="M194.29933,199.83237v-39.66474h91.40135v39.66474z" fill={usb.style.secondaryColor} stroke="#000000" strokeWidth="2.5" />
                                                        <path d="M289.14528,176.86268v-5.59182h12.68913v5.59182z" fill="#000000" stroke="none" strokeWidth="0" />
                                                        <path d="M289.14528,188.26139v-5.59182h12.68913v5.59182z" fill="#000000" stroke="none" strokeWidth="0" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </div>
                                        <span className="usb-flash-data__name">{usb.name}</span>
                                        {/* <!--rotationCenter:46.95067499999999:21.082369999999997--> */}
                                    </div>
                                    <div className="usb-flash-data__right">
                                        <button className="usb-flash-data__button" onClick={() => {
                                            setFileManagerOpened(true);
                                            setSelectedData(usb);
                                        }}>Файловый менеджер...</button>
                                        <button
                                            className="usb-flash-data__button"
                                            onClick={() => {
                                                onSelect?.(usb);
                                                setConnected(p => {
                                                    if (p) return undefined;
                                                    else return usb;
                                                });
                                            }}
                                            disabled={connected && (connected.name !== usb.name)}
                                        >{(connected?.name === usb.name) ? "Отключить" : "Подключить"}</button>
                                        <button className="usb-flash-data__button" onClick={() => handleDelete(usb.id)}>Удалить</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )
                }</div>
                <div className="usb-select-modal__buttons">
                    <button className="usb-select-modal__button" onClick={() => onClose?.()}>Назад</button>
                    <button className="usb-select-modal__button" onClick={() => setModalOpened(true)}>Создать USB-накопитель</button>
                    <button className="usb-select-modal__button" onClick={handleDeviceConnect}>Подключить устройство</button>
                </div>
            </div>

            {(isFileManagerOpened && selectedData) && (
                <FileNavigationModal
                    selectedUSBData={selectedData}
                    // onSaveEnd={(newData) => {
                    //     setData(newData);
                    //     setModalOpened(false);
                    // }}
                    onClose={() => setFileManagerOpened(false)}
                />
            )}

            {isModalOpened && (
                <USBCreateModal
                    onSaveEnd={(newData) => {
                        setData(newData);
                        setModalOpened(false);
                    }}
                    onClose={() => setModalOpened(false)}
                />
            )}
        </div>
    );
}