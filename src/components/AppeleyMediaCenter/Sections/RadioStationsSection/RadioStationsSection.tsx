'use client';

import { getInternetRadioStations, InternetRadioStation, updateRadioStation, addRadioStation, deleteRadioStation } from "@/app/actions";
import { useEffect, useState } from "react";

import "./RadioStationsSection.css";
import AnimatedLoader from "@/components/UI/AnimatedLoader/AnimatedLoader";
import SimpleModal from "@/components/UI/SimpleModal/SimpleModal";

type ModalState = { type: 'add-station', data: Partial<InternetRadioStation> } | { type: 'delete-station', data: InternetRadioStation };

export default function RadioStationsSection() {

    const [stations, setStations] = useState<InternetRadioStation[]>([]);
    const [isLoading, setLoading] = useState(false);
    const [editingStation, setEditingStation] = useState<InternetRadioStation | null>(null);
    const [modal, setModal] = useState<ModalState | null>();

    const getStations = async () => {
        setLoading(true);

        const res = await getInternetRadioStations();

        if (res.success && res.data) {
            setStations(res.data);
        }

        setLoading(false);
    }

    const updateEditingStation = async () => {
        if (!editingStation) return;

        setLoading(true);

        const res = await updateRadioStation(editingStation.id, editingStation);

        if (res.success && res.data) {
            getStations();
            setEditingStation(null);
        }
        else setLoading(false);
    }

    const handleAddStation = async () => {
        if (modal?.type !== 'add-station' || !modal?.data) return;

        setLoading(true);

        const res = await addRadioStation(modal.data);

        if (res.success && res.data) {
            getStations();
            setModal(null);
        }
        else setLoading(false);
    }

    const handleDeleteStation = async () => {
        if (modal?.type !== 'delete-station' || !modal?.data) return;

        setLoading(true);

        const res = await deleteRadioStation(modal.data);

        if (res.success && res.data) {
            getStations();
            setModal(null);
        }
        else setLoading(false);
    }

    // const handleSelect = () => {

    // }

    useEffect(() => {
        getStations();
    }, []);

    const isEditing = (st: InternetRadioStation) => editingStation !== null && st.id === editingStation?.id;

    const updateEditing = (data: Partial<InternetRadioStation>) => {
        setEditingStation(p => {
            if (p) return ({
                ...p,
                ...data,
            }); else return null;
        })
    }

    const updateAddingData = (data: Partial<InternetRadioStation>) => {
        setModal(p => {
            if (p?.type === 'add-station') return ({
                type: 'add-station',
                data: {
                    ...p.data,
                    ...data,
                }
            });
        })
    }

    const renderAddModal = () => {

        if (modal && modal.type === 'add-station') return (
            <div className="add-station-modal__overlay">
                <div className="add-station-modal">
                    <h2 className="add-station-modal__title">Добавление радиостанции</h2>
                    <div className={`radio-station-block editing`}>
                        <div className="radio-station-block__left">
                            <div className="radio-station-block__infobox">
                                <span className="radio-station-block__label">Порядок отображения:</span>
                                <input
                                    type="number"
                                    className="radio-station-block__input"
                                    min={1}
                                    value={modal.data?.order || 1}
                                    onChange={(e) => updateAddingData(({
                                        order: Number(e.target.value),
                                    }))}
                                />
                            </div>
                            <div className="radio-station-block__infobox">
                                <span className="radio-station-block__label">Название:</span>
                                <input
                                    type="text"
                                    className="radio-station-block__input"
                                    value={modal.data?.name || ''}
                                    onChange={(e) => updateAddingData(({
                                        name: String(e.target.value),
                                    }))}
                                />
                            </div>
                            <div className="radio-station-block__infobox">
                                <span className="radio-station-block__label">URL-адрес:</span>
                                <input
                                    type="text"
                                    className="radio-station-block__input"
                                    value={modal.data?.url || ''}
                                    onChange={(e) => updateAddingData(({
                                        url: String(e.target.value),
                                    }))}
                                />
                            </div>
                        </div>
                        {/* <div className="radio-station-block__right">
                            
                        </div> */}
                    </div>
                    <div className="add-station-modal__buttons">
                        <button className="add-station-modal__button" onClick={handleAddStation}>Добавить станцию</button>
                        <button className="add-station-modal__button delete-button" onClick={() => setModal(null)}>Отменить и выйти</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="appeley-media-center-section">
            <h1 className="appeley-media-center-section__title radio-stations-section__title">Управление радиостанциями</h1>
            <div className="radio-stations-section__list">
                {stations.map(st => (
                    <div className={`radio-station-block ${editingStation !== null && editingStation.id !== st.id ? 'disabled' : ''} ${isEditing(st) ? 'editing' : ''}`} key={st.id}>
                        <div className="radio-station-block__left">
                            {(isEditing(st)) ? (
                                <div className="radio-station-block__infobox">
                                    <span className="radio-station-block__label">Порядок отображения:</span>
                                    <input
                                        type="number"
                                        className="radio-station-block__input"
                                        min={1}
                                        value={editingStation?.order || 1}
                                        onChange={(e) => updateEditing(({
                                            order: Number(e.target.value),
                                        }))}
                                    />
                                </div>
                            ) : (
                                <span className="radio-station-block__label display-order">[{st.order}]</span>
                            )}
                            <div className="radio-station-block__infobox">
                                {(isEditing(st)) ? (
                                    <>
                                        <span className="radio-station-block__label">Название:</span>
                                        <input
                                            type="text"
                                            className="radio-station-block__input"
                                            value={editingStation?.name || ''}
                                            onChange={(e) => updateEditing(({
                                                name: String(e.target.value),
                                            }))}
                                        />
                                    </>
                                ) : (
                                    <span className="radio-station-block__label prop-value">{st.name}</span>
                                )}
                            </div>
                            <div className="radio-station-block__infobox">
                                {(isEditing(st)) ? (
                                    <>
                                        <span className="radio-station-block__label">URL-адрес:</span>
                                        <input
                                            type="text"
                                            className="radio-station-block__input"
                                            value={editingStation?.url || ''}
                                            onChange={(e) => updateEditing(({
                                                url: String(e.target.value),
                                            }))}
                                        />
                                    </>
                                ) : (
                                    <span className="radio-station-block__label url">{st.url}</span>
                                )}
                            </div>
                        </div>
                        <div className="radio-station-block__right">
                            {(isEditing(st)) ? (
                                <>
                                    <button className="radio-station-block__button" onClick={updateEditingStation}>Сохранить</button>
                                    <button className="radio-station-block__button delete-button" onClick={() => setEditingStation(null)}>Отменить</button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="radio-station-block__button"
                                        onClick={() => setEditingStation(st)}
                                        disabled={!!editingStation}
                                    >Редактировать</button>
                                    <button
                                        className="radio-station-block__button delete-button"
                                        onClick={() => setModal({
                                            type: "delete-station",
                                            data: st,
                                        })}
                                        disabled={!!editingStation}
                                    >Удалить</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <button className="radio-stations-section__button" onClick={() => setModal({
                type: 'add-station',
                data: {
                    order: stations.length + 1,
                    name: '',
                    url: ''
                }
            })}>Добавить радиостанцию</button>


            {modal?.type === 'add-station' && renderAddModal()}

            {modal?.type === 'delete-station' && (
                <SimpleModal
                    type="confirm"
                    title={`Удалить радиостанцию "${modal.data.name}"?`}

                    confirmBtnText="Удалить"
                    cancelBtnText="Отмена"

                    onConfirm={handleDeleteStation}
                    onCancel={() => setModal(null)}
                />
            )}

            {isLoading && (
                <div className="radio-stations-section__loading">
                    <AnimatedLoader styles={{ scale: 5 }} />
                </div>
            )}
        </div>
    )
}