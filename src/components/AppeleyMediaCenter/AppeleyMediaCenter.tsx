'use client';

import { ReactElement, ReactNode, useState } from "react";
import "./AppeleyMediaCenter.css";
import RadioStationsSection from "./Sections/RadioStationsSection/RadioStationsSection";
import PlayedRadioTracksSection from "./Sections/PlayedRadioTracksSection/PlayedRadioTracksSection";
import RadioCaptureDetectionSection from "./Sections/RadioCaptureDetectionSection/RadioCaptureDetectionSection";

export interface AppeleyMediaCenterProps {
    onClose?: () => void;
}

type MainLeftElement = ({
    type: "button";
    label: string;
    onClick: () => void;
    isDisabled?: boolean;
} | {
    type: "category";
    label: string;

    innerElements: MainLeftElement[];
}) & {
    value: string;
};

type MainRightSection = {
    Component: () => ReactElement;
}


export default function AppeleyMediaCenter({ onClose }: AppeleyMediaCenterProps) {

    const [currentSection, setCurrentSection] = useState<string | null>(null);

    const LEFT_DATA_ELEMENTS: MainLeftElement[] = [
        {
            type: "category",
            label: "Управление ресивером",

            value: "receiver",

            innerElements: [
                {
                    type: "button",
                    label: "Настройки текущего ресивера",

                    value: "settings",

                    onClick: () => { }
                }
            ],
        },
        {
            type: "category",
            label: "Данные и источники",
            value: "data",

            innerElements: [
                {
                    value: "usb",
                    type: "category",
                    label: "USB-устройства",
                    innerElements: [
                        {
                            value: "available",
                            type: "button",
                            label: "Доступные устройства",
                            onClick: () => { },
                            isDisabled: true
                        },
                        {
                            value: "file-manager",
                            type: "button",
                            label: "Файловый менеджер",
                            onClick: () => { },
                            isDisabled: true
                        },
                    ],
                },

                {
                    value: "internet-radio",
                    type: "category",
                    label: "Интернет-радио",
                    // onClick: () => { },
                    innerElements: [
                        {
                            value: "stations",
                            type: "button",
                            label: "Управление радиостанциями",
                            onClick: () => { },
                            // isDisabled: true
                        },
                        {
                            value: "played-tracks",
                            type: "button",
                            label: "Воспроизведенные треки",
                            onClick: () => { },
                            // isDisabled: true
                        },
                        {
                            value: "capture-and-detection",
                            type: "button",
                            label: "Захват и распознавание",
                            onClick: () => { },
                            // isDisabled: true
                        },
                    ],
                }
            ],
        }

    ];

    const RIGHT_SECTIONS: Record<string, MainRightSection> = {
        "/data/internet-radio/stations": {
            Component: RadioStationsSection
        },
        "/data/internet-radio/played-tracks": {
            Component: PlayedRadioTracksSection
        },
        "/data/internet-radio/capture-and-detection": {
            Component: RadioCaptureDetectionSection
        }
    }

    const renderElements = (list: MainLeftElement[], level: number = 0, path: string = '') => {
        if (level > 5) return;

        // let p = '';

        let data: ReactNode[] = list.map((el, idx) => (
            el.type === 'button' ? (
                <div
                    className={`appeley-media-center-main-element level-${level} ${el.isDisabled ? 'disabled' : ''} ${(currentSection === `${path}/${el.value}`) ? 'current-selection' : ''}`}
                    style={{
                        marginLeft: `${(level * 10) + 0}px`
                    }}
                    // data-level={level}
                    onClick={() => {
                        if (!el.isDisabled) {
                            el.onClick();
                            setCurrentSection(`${path}/${el.value}`);
                        }
                        // alert(`${path}/${el.value}`);
                    }}
                // disabled={el.isDisabled}
                >{el.label}</div>
            ) : (
                <>
                    <div
                        className={`appeley-media-center-main-element type-category level-${level}`}
                        style={{
                            marginLeft: `${(level * 10) + 0}px`
                        }}
                    // data-level={level}
                    >
                        {el.label}
                    </div>
                    {renderElements(el.innerElements, (level + 1), `${path}/${el.value}`)}
                </>
            )
        ));

        return data;
    };

    const renderSection = (sectionsObj: Record<string, MainRightSection>, sectionPath: string | null) => {
        if (sectionPath) {
            const sect = sectionsObj[sectionPath];

            const renderContent = () => {
                if (sectionPath === '/data/internet-radio/stations') {
                    
                }
            };

            if (sect) return <sect.Component />;

            // if (sect) return (
            //     <div className="appeley-media-center-section">
            //         <h2 className="appeley-media-center-section__title">{sect.title}</h2>
            //         <div className="appeley-media-center-section__content">
            //             {renderContent()}
            //         </div>
            //     </div>
            // );
        }
    }

    return (
        <div className="appeley-media-center__overlay">
            <div className="appeley-media-center">
                <div className="appeley-media-center-navigation">
                    <div className="appeley-media-center-navigation__left">
                        <h1 className="appeley-media-center-navigation__title">APPELEY Media Center</h1>
                    </div>
                    <div className="appeley-media-center-navigation__right">
                        <button className="appeley-media-center-navigation__button" onClick={onClose}>⨉</button>
                    </div>
                </div>
                <div className="appeley-media-center-main">
                    <div className="appeley-media-center-main__left">
                        {renderElements(LEFT_DATA_ELEMENTS)}
                    </div>
                    <div className="appeley-media-center-main__right">
                        {renderSection(RIGHT_SECTIONS, currentSection)}
                    </div>
                </div>
            </div>
        </div>
    );
}