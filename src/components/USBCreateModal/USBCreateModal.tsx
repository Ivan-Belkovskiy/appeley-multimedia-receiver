'use client';

import { createUSBFlash, getUSBData, USBFlashInfo } from "@/app/actions";
import "./USBCreateModal.css";
import { useEffect, useState } from "react";

export interface USBEditingData {
    name: string;
    style: {
        primaryColor: string;
        secondaryColor: string;
    }
}

export default function USBCreateModal({ onClose, onSaveEnd }: { onClose: () => void; onSaveEnd: (newData: USBFlashInfo[]) => void }) {

    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState<USBEditingData>({
        name: '',
        style: {
            primaryColor: '#199400',
            secondaryColor: '#000e88'
        }
    });


    const handleSave = async () => {
        const res = await createUSBFlash(data);

        if (res.success && res.data) {
            onSaveEnd(res.data);
        }

    }


    return (
        <div className="usb-create-modal__overlay">
            <div className="usb-create-modal">
                <h1 className="usb-create-modal__title">Создание USB-накопителя</h1>
                <div className="usb-create-modal__content">
                    <div className="usb-create-modal__block">
                        <span className="usb-create-modal__label">Название:</span>
                        <input
                            type="text"
                            className="usb-create-modal__input"
                            value={data.name || ""}
                            onChange={(e) => setData(p => ({
                                ...p,
                                name: e.target.value
                            }))}
                        />
                    </div>
                    <div className="usb-create-modal__block">
                        <span className="usb-create-modal__label">Цвет №1:</span>
                        <input
                            type="color"
                            className="usb-create-modal__input"
                            value={data.style.primaryColor || "#199400"}
                            onChange={(e) => setData(p => ({
                                ...p,
                                style: {
                                    ...p.style,
                                    primaryColor: e.target.value
                                }
                            }))}
                        />
                    </div>
                    <div className="usb-create-modal__block">
                        <span className="usb-create-modal__label">Цвет №2:</span>
                        <input
                            type="color"
                            className="usb-create-modal__input"
                            value={data.style.secondaryColor || "#000e88"}
                            onChange={(e) => setData(p => ({
                                ...p,
                                style: {
                                    ...p.style,
                                    secondaryColor: e.target.value
                                }
                            }))}
                        />
                    </div>
                </div>
                <div className="usb-create-modal__buttons">
                    <button className="usb-create-modal__button" onClick={onClose}>Назад</button>
                    <button className="usb-create-modal__button" onClick={handleSave}>Создать USB-накопитель</button>
                </div>
            </div>
        </div>
    );
}