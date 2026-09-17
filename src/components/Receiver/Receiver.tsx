'use client';

import { Dispatch, RefObject, SetStateAction, useEffect, useRef, useState } from "react";
import FrontPanel from "./FrontPanel/FrontPanel";
import MainController, { MainControllerInputButtons, MainControllerInputs, MainControllerOutputs, MainControllerSettings, MenuOptionValue } from "./MainController/MainController";
import { getInternetRadioStations, InternetRadioStation, loadData, saveData } from "@/app/actions";
import { applyColorOffset } from "@/utils/color";
import "./Receiver.css";
import AppeleyRC from "./RemoteController/AppeleyRC";

export default function AppeleyReceiver({ internetRadioStations, videoOutputRef, setVideoPowerOn }: {
    videoOutputRef: RefObject<HTMLVideoElement | null>;
    setVideoPowerOn: Dispatch<SetStateAction<boolean | undefined>>;

    internetRadioStations: InternetRadioStation[];
}) {

    // const [internetRadioStations, setInternetRadioStations] = useState<InternetRadioStation[]>([]);

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

        // alert(JSON.stringify(result[0].onSelect));
        
        return result;
    }

    const generateNumberItems = (count: number, startValue: number = 0, step: number = 2, onSelect: (s: MainControllerSettings, value: number) => any, reference: (s: MainControllerSettings, value: number) => any) => {
        let result: MenuOptionValue[] = [];

        for (let i = (startValue); i < (count + (startValue)); i++) {
            result.push({
                label: `${String((i + 1) * step).padStart(2, "0")}`,
                onSelect: (s) => {
                    return onSelect(s, ((i + 1) * step));
                },
                reference: (s) => {
                    return reference(s, ((i + 1) * step));
                },
                // onSelect: (s) => ({
                //     ...s,
                //     indication: {
                //         ...s.indication,
                //         [property]: {
                //             type: 'static',
                //             color: applyColorOffset('#0088ff', (i * step)),
                //         }
                //     }
                // }),
                // reference: (s) => s.indication[property].color === applyColorOffset('#0088ff', (i * step)),
                displayPreview: true
            });
        }

        // alert(JSON.stringify(result[0].onSelect));

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
            encoderMenuOptions: [
                {
                    type: "property",
                    label: "REPEAT",

                    values: [
                        {
                            label: "RPT OFF",
                            onSelect: (s) => ({
                                ...s,
                                playMode: {
                                    ...s.playMode,
                                    repeat: null,
                                }
                            }),
                            reference: (s) => !s.playMode.repeat,
                            shortPropName: "",
                        },
                        {
                            label: "TRACK RPT",
                            onSelect: (s) => ({
                                ...s,
                                playMode: {
                                    ...s.playMode,
                                    repeat: "TRACK",
                                }
                            }),
                            reference: (s) => s.playMode.repeat === 'TRACK',
                            shortPropName: "",
                        },
                        {
                            label: "FOLDER RPT",
                            onSelect: (s) => ({
                                ...s,
                                playMode: {
                                    ...s.playMode,
                                    repeat: "FOLDER",
                                }
                            }),
                            reference: (s) => s.playMode.repeat === 'FOLDER',
                            shortPropName: "",
                        },
                    ],
                },
                {
                    type: "property",
                    label: "RANDOM",

                    values: [
                        {
                            label: "RND OFF",
                            onSelect: (s) => ({
                                ...s,
                                playMode: {
                                    ...s.playMode,
                                    random: null,
                                }
                            }),
                            reference: (s) => !s.playMode.random,
                            shortPropName: "",
                        },
                        {
                            label: "FOLDER RND",
                            onSelect: (s) => ({
                                ...s,
                                playMode: {
                                    ...s.playMode,
                                    random: "FOLDER",
                                }
                            }),
                            reference: (s) => s.playMode.random === 'FOLDER',
                            shortPropName: "",
                        },
                        {
                            label: "ALL RND",
                            onSelect: (s) => ({
                                ...s,
                                playMode: {
                                    ...s.playMode,
                                    random: "ALL",
                                }
                            }),
                            reference: (s) => s.playMode.random === 'ALL',
                            shortPropName: "",
                        },
                    ],
                },
            ],
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
                                    label: "CURRENT/ALL",
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
                        },
                        {
                            type: "block",
                            label: "BEEP",

                            innerOptions: [
                                {
                                    type: "property",
                                    label: "BEEP ON/OFF",

                                    values: [
                                        {
                                            label: "ON",
                                            onSelect: (s) => ({
                                                ...s,
                                                audio: {
                                                    ...s.audio,
                                                    beeper: {
                                                        ...s.audio.beeper,
                                                        on: true,
                                                    }
                                                }
                                            }),
                                            reference: (s) => s.audio.beeper.on,
                                            shortPropName: "BEEP",
                                        },
                                        {
                                            label: "OFF",
                                            onSelect: (s) => ({
                                                ...s,
                                                audio: {
                                                    ...s.audio,
                                                    beeper: {
                                                        ...s.audio.beeper,
                                                        on: false,
                                                    }
                                                }
                                            }),
                                            reference: (s) => !s.audio.beeper.on,
                                            shortPropName: "BEEP",
                                        }
                                    ],
                                },
                                {
                                    type: "property",
                                    label: "BEEP VOLUME",

                                    values: [
                                        ...generateNumberItems(4, 0, 25, (s, val) => ({
                                            ...s,
                                            audio: {
                                                ...s.audio,
                                                beeper: {
                                                    ...s.audio.beeper,
                                                    volume: (val / 100)
                                                }
                                            }
                                        }), (s, val) => s.audio.beeper.volume === (val / 100))
                                    ]
                                }
                            ],

                            // values: [
                            //     {
                            //         label: "ON",
                            //         onSelect: (s) => ({
                            //             ...s,
                            //             audio: {
                            //                 ...s.audio,
                            //                 beeper: {
                            //                     ...s.audio.beeper,
                            //                     on: true,
                            //                 }
                            //             }
                            //         }),
                            //         reference: (s) => s.audio.beeper.on
                            //     },
                            //     {
                            //         label: "OFF",
                            //         onSelect: (s) => ({
                            //             ...s,
                            //             audio: {
                            //                 ...s.audio,
                            //                 beeper: {
                            //                     ...s.audio.beeper,
                            //                     on: false,
                            //                 }
                            //             }
                            //         }),
                            //         reference: (s) => !s.audio.beeper.on
                            //     }
                            // ],
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
                beeper: {
                    on: true,
                    volume: 1
                }
            },

            playMode: {

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
            6: {},
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
                controllerOutputsRef.current.sourceData["6"].connectionInfo = res.data.outputs.sourceData[5].connectionInfo;
            }

            // if (res.data.outputs.sourceData[5]) {
            //     controllerOutputsRef.current.sourceData[5] = res.data.outputs.sourceData[5];
            // }
        }

        // await loadInternetRadioStations();
        // console.log(res.data);
    }

    // const loadInternetRadioStations = async () => {
    //     const res = await getInternetRadioStations();

    //     if (res.success && res.data) {
    //         setInternetRadioStations(res.data);
    //     }
    // };

    function beforeUnloadHandler(this: Window, e: BeforeUnloadEvent) {
        saveData(controllerInputsRef.current, controllerOutputsRef.current);
        // this.navigator.sendBeacon('/api/data/save');
    }

    useEffect(() => {

        if (typeof window !== 'undefined') window.addEventListener('beforeunload', beforeUnloadHandler);

        loadSavedData();

        // loadInternetRadioStations();

        // alert(JSON.stringify(internetRadioStations));

        return () => window.removeEventListener('beforeunload', beforeUnloadHandler);

    }, []);

    // const buttonHandlers = (
    //     name: keyof MainControllerInputButtons,
    //     onActivate?: () => void,
    //     onDeactivate?: () => void,
    // ) => ({
    //     onPointerDown: (e: React.PointerEvent) => {
    //         (e.currentTarget as Element).setPointerCapture(e.pointerId);

    //         e.preventDefault();

    //         controllerInputsRef.current.buttons = { ...controllerInputsRef.current.buttons, [name]: true };
    //         onActivate?.();
    //     },
    //     onPointerUp: (e: React.PointerEvent) => {
    //         try {
    //             (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    //         } catch { }
    //         controllerInputsRef.current.buttons = { ...controllerInputsRef.current.buttons, [name]: false };
    //         onDeactivate?.();
    //     },
    //     onPointerCancel: () => {
    //         controllerInputsRef.current.buttons = { ...controllerInputsRef.current.buttons, [name]: false };
    //         onDeactivate?.();
    //     },
    //     onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    // });

    const [isRCModalOpened, setRCModalOpened] = useState(false);

    return (
        <div className="appeley-receiver">
            <MainController internetRadioStations={internetRadioStations} inputsRef={controllerInputsRef} outputsRef={controllerOutputsRef} videoOutputRef={videoOutputRef} setVideoPowerOn={setVideoPowerOn} />
            <FrontPanel
                internetRadioStations={internetRadioStations}
                mainControllerInputsRef={controllerInputsRef}
                mainControllerOutputsRef={controllerOutputsRef}
            />

            <div className="appeley-receiver__container">
                <button className="appeley-receiver__ui-button" onClick={() => setRCModalOpened(true)}>Remote Control</button>
            </div>

            {isRCModalOpened && (
                <div className="remote-control-modal">
                    <div className="remote-control-modal__left">
                        <AppeleyRC
                            mainControllerInputsRef={controllerInputsRef}
                        />
                    </div>
                    <div className="remote-control-modal__right">
                        <button className="remote-control-modal__button" onClick={() => setRCModalOpened(false)}>Close Window</button>
                    </div>
                </div>
            )}
        </div>
    )
}