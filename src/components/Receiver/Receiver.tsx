'use client';

import { Dispatch, RefObject, SetStateAction, useEffect, useRef, useState } from "react";
import FrontPanel from "./FrontPanel/FrontPanel";
import MainController, { MainControllerInputs, MainControllerOutputs, MenuOptionValue } from "./MainController/MainController";
import { loadData, saveData } from "@/app/actions";
import { applyColorOffset } from "@/utils/color";

export default function AppeleyReceiver({ videoOutputRef, setVideoPowerOn }: { videoOutputRef: RefObject<HTMLVideoElement | null>; setVideoPowerOn: Dispatch<SetStateAction<boolean | undefined>>; }) {

    const generateColorItems = (property: "buttons" | "display", count: number, step: number = 2) => {
        let result: MenuOptionValue[] = [];

        for (let i = 0; i < count; i++) {
            result.push({
                label: `${String(i + 1).padStart(2, "0")}`,
                onSelect: (s) => ({
                    ...s,
                    indication: {
                        ...s.indication,
                        [property]: {
                            type: 'static',
                            color: applyColorOffset('#0088ff', (i * step)),
                        }
                    }
                }),
                reference: (s) => s.indication[property].color === applyColorOffset('#0088ff', (i * step)),
                displayPreview: true
            });
        }
        return result;
    }

    const controllerInputsRef = useRef<MainControllerInputs>({
        sourceData: {
            1: {},
            2: {},
        }
    });
    const controllerOutputsRef = useRef<MainControllerOutputs>({
        menu: {
            navigation: {
                _settingsBeforeUpdate: null,
                openedIdxArray: [],
                currentIdx: 0,
                // optionValues: []
            },
            options: [
                {
                    type: "property",
                    label: "DEMO",
                    // valueReference: (s) => s.demo.,

                    values: [
                        {
                            label: "ON 20s",
                            onSelect: (s) => ({
                                ...s,
                                demo: {
                                    on: true,
                                    interval: 20
                                }
                            }),
                            reference: (s) => s.demo.on === true && s.demo.interval === 20,
                        },
                        {
                            label: "ON 40s",
                            onSelect: (s) => ({
                                ...s,
                                demo: {
                                    on: true,
                                    interval: 40
                                }
                            }),
                            reference: (s) => s.demo.on === true && s.demo.interval === 40,
                        },
                        {
                            label: "ON 60s",
                            onSelect: (s) => ({
                                ...s,
                                demo: {
                                    on: true,
                                    interval: 60
                                }
                            }),
                            reference: (s) => s.demo.on === true && s.demo.interval === 60,
                        },
                        {
                            label: "ON 80s",
                            onSelect: (s) => ({
                                ...s,
                                demo: {
                                    on: true,
                                    interval: 80
                                }
                            }),
                            reference: (s) => s.demo.on === true && s.demo.interval === 80,
                        },
                        {
                            label: "OFF",
                            onSelect: (s) => ({
                                ...s,
                                demo: {
                                    on: false,
                                    interval: 0
                                }
                            }),
                            reference: (s) => s.demo.on === false,
                        },
                    ],
                },
                {
                    type: "block",
                    label: "COLOR",

                    innerOptions: [
                        {
                            type: "property",
                            label: "BUTTON COLOR",

                            values: [
                                ...generateColorItems('buttons', 20, 0.05),
                            ],
                            // values: [
                            //     {
                            //         label: "01",
                            //         onSelect: (s) => ({
                            //             ...s,
                            //             indication: {
                            //                 ...s.indication,
                            //                 buttons: {
                            //                     type: 'static',
                            //                     color: '#0088ff',
                            //                 }
                            //             }
                            //         }),
                            //         reference: (s) => s.indication.buttons.color === '#0088ff',
                            //     },
                            //     {
                            //         label: "02",
                            //         onSelect: (s) => ({
                            //             ...s,
                            //             indication: {
                            //                 ...s.indication,
                            //                 buttons: {
                            //                     type: 'static',
                            //                     color: '#00eeff',
                            //                 }
                            //             }
                            //         }),
                            //         reference: (s) => s.indication.buttons.color === '#00eeff',
                            //     },
                            // ],
                        },
                        {
                            type: "property",
                            label: "DISPLAY COLOR",

                            values: [
                                ...generateColorItems('display', 20, 0.05),
                            ],
                            // values: [
                            //     {
                            //         label: "01",
                            //         onSelect: (s) => ({
                            //             ...s,
                            //             indication: {
                            //                 ...s.indication,
                            //                 display: {
                            //                     type: 'static',
                            //                     color: '#0088ff',
                            //                 }
                            //             }
                            //         }),
                            //         reference: (s) => s.indication.display.color === '#0088ff',
                            //     },
                            //     {
                            //         label: "02",
                            //         onSelect: (s) => ({
                            //             ...s,
                            //             indication: {
                            //                 ...s.indication,
                            //                 display: {
                            //                     type: 'static',
                            //                     color: applyColorOffset('#00eeff', 0.5),
                            //                 }
                            //             }
                            //         }),
                            //         reference: (s) => s.indication.display.color === applyColorOffset('#00eeff', 0.5),
                            //     },
                            // ],
                        },
                    ]
                },
                {
                    type: "block",
                    label: "DISPLAY",

                    innerOptions: [
                        {
                            type: "property",
                            label: "PLAY TIME FORMAT",

                            values: [
                                {
                                    label: "CURRENT",
                                    onSelect: (s) => ({
                                        ...s,
                                        display: {
                                            ...s.display,
                                            playTimeFormat: "CURRENT_TIME",
                                        }
                                    }),
                                    reference: (s) => s.display.playTimeFormat === 'CURRENT_TIME',
                                    shortPropName: "PTF",
                                },
                                {
                                    label: "CURRENT / DURATION",
                                    onSelect: (s) => ({
                                        ...s,
                                        display: {
                                            ...s.display,
                                            playTimeFormat: "CURRENT_TIME_AND_DURATION",
                                        }
                                    }),
                                    reference: (s) => s.display.playTimeFormat === 'CURRENT_TIME_AND_DURATION',
                                    shortPropName: "PTF",
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "block",
                    label: "AUDIO",

                    innerOptions: [
                        {
                            type: "property",
                            label: "VOLUME CONTROL",

                            values: [
                                {
                                    label: "NONE",
                                    onSelect: (s) => ({
                                        ...s,
                                        audio: {
                                            ...s.audio,
                                            volumeControl: "NONE",
                                        }
                                    }),
                                    reference: (s) => s.audio.volumeControl === 'NONE',

                                    shortPropName: "VOL CONTROL",
                                },
                                {
                                    label: "AUTO",
                                    onSelect: (s) => ({
                                        ...s,
                                        audio: {
                                            ...s.audio,
                                            volumeControl: "AUTO",
                                        }
                                    }),
                                    reference: (s) => s.audio.volumeControl === 'AUTO',

                                    shortPropName: "VOL CONTROL",
                                }
                            ]
                        }
                    ]
                },
            ],
        },
        settings: {
            demo: {
                on: true,
                interval: 20,
            },
            indication: {
                display: {
                    type: "static",
                    color: "#0088ff",
                },
                buttons: {
                    type: "static",
                    color: "#0088ff",
                }
            },
            display: {
                playTimeFormat: "CURRENT_TIME",
            },
            audio: {
                volumeControl: "NONE",
            }
        },
        currentSource: 1,
        mainVolume: 10,
        indicationColor: {
            display: "#0088ff",
            buttons: "#0088ff"
        },
        sourceData: {
            // 0: {}, // uncomment after adding to interface MainControllerOutputs
            1: {},
            2: {},
            // 3: {}, // uncomment after adding to interface MainControllerOutputs
            // 4: {}, // uncomment after adding to interface MainControllerOutputs
            5: {},
        }
    });

    const loadSavedData = async () => {
        const res = await loadData();
        // alert('load')
        if (res.data) {
            // controllerInputsRef.current = {
            //     ...controllerInputsRef.current,
            // };
            // controllerInputsRef.current = res.data.inputs;
            controllerOutputsRef.current.currentSource = res.data.outputs.currentSource;
            controllerOutputsRef.current.mainVolume = res.data.outputs.mainVolume;
            // controllerOutputsRef.current.indicationColor = res.data.outputs.display;

            if (res.data.outputs.sourceData[1]) {
                controllerOutputsRef.current.sourceData[1] = {
                    dataToLoad: {
                        trackNumber: res.data.outputs.sourceData[1]?.playbackData?.trackNumber ?? res.data.outputs.sourceData[1]?.dataToLoad?.trackNumber ?? 0,
                        folderNumber: res.data.outputs.sourceData[1]?.playbackData?.folderNumber ?? res.data.outputs.sourceData[1]?.dataToLoad?.folderNumber ?? 0,
                    }
                };
            }

            // if ((res.data.outputs.sourceData[1].navigationData)) {
            //     controllerInputsRef.current.sourceData[1].allowReading = true;
            // }

            if (res.data.outputs.sourceData[5].connectionInfo) {
                controllerOutputsRef.current.sourceData[5].connectionInfo = res.data.outputs.sourceData[5].connectionInfo;
            }

            // if (res.data.outputs.sourceData[5]) {
            //     controllerOutputsRef.current.sourceData[5] = res.data.outputs.sourceData[5];
            // }
        }
        // console.log(res.data);
    }

    function beforeUnloadHandler(this: Window, e: BeforeUnloadEvent) {
        saveData(controllerInputsRef.current, controllerOutputsRef.current);
        // this.navigator.sendBeacon('/api/data/save');
    }

    useEffect(() => {

        if (typeof window !== 'undefined') window.addEventListener('beforeunload', beforeUnloadHandler);

        loadSavedData();

        return () => window.removeEventListener('beforeunload', beforeUnloadHandler);

    }, []);

    return (
        <div className="appeley-receiver">
            <MainController inputsRef={controllerInputsRef} outputsRef={controllerOutputsRef} videoOutputRef={videoOutputRef} setVideoPowerOn={setVideoPowerOn} />
            <FrontPanel
                mainControllerInputsRef={controllerInputsRef}
                mainControllerOutputsRef={controllerOutputsRef}
            />
        </div>
    )
}