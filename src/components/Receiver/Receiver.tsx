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

    const EQ_PRESETS: Record<string, MainControllerSettings['equalizer']['bands']> = {
        FLAT: {
            low: { frequency: 100, gain: 0, q: 1.0 },
            mid: { frequency: 1000, gain: 0, q: 1.0 },
            high: { frequency: 6000, gain: 0, q: 1.0 },
        },
        ROCK: {
            low: { frequency: 100, gain: +5, q: 1.2 },
            mid: { frequency: 1000, gain: -3, q: 1.5 },
            high: { frequency: 8000, gain: +4, q: 1.2 },
        },
        JAZZ: {
            low: { frequency: 80, gain: +3, q: 1.0 },
            mid: { frequency: 800, gain: +2, q: 1.5 },
            high: { frequency: 6000, gain: +3, q: 1.0 },
        },
        POP: {
            low: { frequency: 100, gain: +2, q: 1.0 },
            mid: { frequency: 2000, gain: +3, q: 1.5 },
            high: { frequency: 8000, gain: +2, q: 1.2 },
        },
        VOCAL: {
            low: { frequency: 100, gain: -4, q: 1.0 },
            mid: { frequency: 2500, gain: +6, q: 1.8 },
            high: { frequency: 8000, gain: +2, q: 1.0 },
        },
        BASS: {
            low: { frequency: 80, gain: +8, q: 1.5 },
            mid: { frequency: 1000, gain: -2, q: 1.0 },
            high: { frequency: 6000, gain: 0, q: 1.0 },
        },
    };

    const applyPreset = (s: MainControllerSettings, preset: string) => {
        const bands = EQ_PRESETS[preset];
        if (!bands) return s;
        return {
            ...s,
            equalizer: {
                ...s.equalizer,
                preset: preset as any,
                bands: JSON.parse(JSON.stringify(bands)),
            },
        };
    };
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
                timerBeforeClose: (30 * 60),
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
                                ...generateColorItems('buttons', 40, 0.025),
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
                                ...generateColorItems('display', 40, 0.025),
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
                        },
                        {
                            type: "block",
                            label: "DATA DISPLAY",

                            innerOptions: [
                                {
                                    type: "property",
                                    label: "DATA DISP MODE",

                                    values: [
                                        {
                                            label: "DEFAULT",
                                            onSelect: (s) => ({
                                                ...s,
                                                display: {
                                                    ...s.display,
                                                    dataDisplay: {
                                                        ...s.display.dataDisplay,
                                                        mode: "DEFAULT",
                                                    },
                                                }
                                            }),
                                            reference: (s) => s.display.dataDisplay.mode === 'DEFAULT',
                                            shortPropName: "DDM",
                                        },
                                        {
                                            label: "DYNAMIC",
                                            onSelect: (s) => ({
                                                ...s,
                                                display: {
                                                    ...s.display,
                                                    ...s.display,
                                                    dataDisplay: {
                                                        ...s.display.dataDisplay,
                                                        mode: "DYNAMIC",
                                                    },
                                                }
                                            }),
                                            reference: (s) => s.display.dataDisplay.mode === 'DYNAMIC',
                                            shortPropName: "DDM",
                                        }
                                    ]
                                },
                                {
                                    type: "property",
                                    label: "DISPLAY INTERVAL",

                                    values: [
                                        {
                                            label: "3s",
                                            onSelect: (s) => ({
                                                ...s,
                                                display: {
                                                    ...s.display,
                                                    dataDisplay: {
                                                        ...s.display.dataDisplay,
                                                        interval: 3,
                                                    }
                                                }
                                            }),

                                            reference: (s) => s.display.dataDisplay.interval === 3,
                                            shortPropName: 'DISP INT'
                                        },
                                        {
                                            label: "5s",
                                            onSelect: (s) => ({
                                                ...s,
                                                display: {
                                                    ...s.display,
                                                    dataDisplay: {
                                                        ...s.display.dataDisplay,
                                                        interval: 5,
                                                    }
                                                }
                                            }),

                                            reference: (s) => s.display.dataDisplay.interval === 5,
                                            shortPropName: 'DISP INT'
                                        },
                                        {
                                            label: "10s",
                                            onSelect: (s) => ({
                                                ...s,
                                                display: {
                                                    ...s.display,
                                                    dataDisplay: {
                                                        ...s.display.dataDisplay,
                                                        interval: 10,
                                                    }
                                                }
                                            }),

                                            reference: (s) => s.display.dataDisplay.interval === 10,
                                            shortPropName: 'DISP INT'
                                        },
                                        {
                                            label: "15s",
                                            onSelect: (s) => ({
                                                ...s,
                                                display: {
                                                    ...s.display,
                                                    dataDisplay: {
                                                        ...s.display.dataDisplay,
                                                        interval: 15,
                                                    }
                                                }
                                            }),

                                            reference: (s) => s.display.dataDisplay.interval === 15,
                                            shortPropName: 'DISP INT'
                                        },
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "block",
                    label: "APPELEY EQ",

                    innerOptions: [
                        {
                            type: "property",
                            label: "EQ ON/OFF",
                            values: [
                                {
                                    label: "ON",
                                    onSelect: (s) => ({ ...s, equalizer: { ...s.equalizer, on: true } }),
                                    reference: (s) => s.equalizer.on,
                                    shortPropName: "EQ",
                                },
                                {
                                    label: "OFF",
                                    onSelect: (s) => ({ ...s, equalizer: { ...s.equalizer, on: false } }),
                                    reference: (s) => !s.equalizer.on,
                                    shortPropName: "EQ",
                                },
                            ],
                        },
                        {
                            type: "property",
                            label: "PRESET",
                            values: [
                                { label: "FLAT", shortPropName: "PRE", onSelect: s => applyPreset(s, 'FLAT'), reference: s => s.equalizer.preset === 'FLAT' },
                                { label: "ROCK", shortPropName: "PRE", onSelect: s => applyPreset(s, 'ROCK'), reference: s => s.equalizer.preset === 'ROCK' },
                                { label: "JAZZ", shortPropName: "PRE", onSelect: s => applyPreset(s, 'JAZZ'), reference: s => s.equalizer.preset === 'JAZZ' },
                                { label: "POP", shortPropName: "PRE", onSelect: s => applyPreset(s, 'POP'), reference: s => s.equalizer.preset === 'POP' },
                                { label: "VOCAL", shortPropName: "PRE", onSelect: s => applyPreset(s, 'VOCAL'), reference: s => s.equalizer.preset === 'VOCAL' },
                                { label: "BASS", shortPropName: "PRE", onSelect: s => applyPreset(s, 'BASS'), reference: s => s.equalizer.preset === 'BASS' },
                                { label: "CUSTOM", shortPropName: "PRE", onSelect: (s) => ({ ...s, equalizer: { ...s.equalizer, preset: 'CUSTOM' } }), reference: s => s.equalizer.preset === 'CUSTOM' },
                            ],
                        },
                        {
                            type: "block",
                            label: "LOW BAND",
                            innerOptions: [
                                {
                                    type: "property",
                                    label: "LOW FREQ",
                                    values: [60, 80, 100, 150, 200, 250].map(f => ({
                                        label: `${f}Hz`,
                                        shortPropName: "L.F",
                                        onSelect: (s) => ({
                                            ...s,
                                            equalizer: {
                                                ...s.equalizer,
                                                preset: 'CUSTOM',
                                                bands: {
                                                    ...s.equalizer.bands,
                                                    low: { ...s.equalizer.bands.low, frequency: f },
                                                },
                                            },
                                        }),
                                        reference: (s) => s.equalizer.bands.low.frequency === f,
                                    })),
                                },
                                {
                                    type: "property",
                                    label: "LOW GAIN",
                                    values: generateNumberItems(24, -12, 1, (s, val) => ({
                                        ...s,
                                        equalizer: {
                                            ...s.equalizer,
                                            preset: 'CUSTOM',
                                            bands: {
                                                ...s.equalizer.bands,
                                                low: { ...s.equalizer.bands.low, gain: val },
                                            },
                                        },
                                    }), (s, val) => s.equalizer.bands.low.gain === val),
                                },
                                {
                                    type: "property",
                                    label: "LOW Q",
                                    values: [0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map(q => ({
                                        label: `Q${q.toFixed(1)}`,
                                        shortPropName: "L.Q",
                                        onSelect: (s) => ({
                                            ...s,
                                            equalizer: {
                                                ...s.equalizer,
                                                preset: 'CUSTOM',
                                                bands: { ...s.equalizer.bands, low: { ...s.equalizer.bands.low, q } },
                                            },
                                        }),
                                        reference: (s) => s.equalizer.bands.low.q === q,
                                    })),
                                },
                            ],
                        },
                    ],
                },
                {
                    type: "block",
                    label: "AUDIO",

                    innerOptions: [
                        {
                            type: "block",
                            label: "VOLUME CONTROL",

                            innerOptions: [
                                {
                                    type: "property",
                                    label: "VOL CNTRL ON/OFF",

                                    values: [
                                        {
                                            label: "ON",
                                            onSelect: (s) => ({
                                                ...s,
                                                audio: {
                                                    ...s.audio,
                                                    volumeControl: {
                                                        ...s.audio.volumeControl,
                                                        on: true
                                                    }
                                                }
                                            }),
                                            reference: (s) => s.audio.volumeControl.on,
                                            shortPropName: "VOL CNTRL",
                                        },
                                        {
                                            label: "OFF",
                                            onSelect: (s) => ({
                                                ...s,
                                                audio: {
                                                    ...s.audio,
                                                    volumeControl: {
                                                        ...s.audio.volumeControl,
                                                        on: false
                                                    }
                                                }
                                            }),
                                            reference: (s) => !s.audio.volumeControl.on,
                                            shortPropName: "VOL CNTRL",
                                        }
                                    ]
                                },
                                {
                                    type: "block",
                                    label: "VOL CONTROL DATA",

                                    innerOptions: [
                                        {
                                            type: "block",
                                            label: "DAY VOL CNTRL",

                                            innerOptions: [
                                                {
                                                    type: "property",
                                                    label: "DAY TIME",

                                                    valueType: "input",
                                                    subType: "time",

                                                    initialValue: (s) => s.audio.volumeControl.settings?.maxVolume.time || [0, 0],

                                                    onInput: (s, hours, minutes) => ({
                                                        ...s,
                                                        audio: {
                                                            ...s.audio,
                                                            volumeControl: {
                                                                ...s.audio.volumeControl,
                                                                settings: {
                                                                    ...s.audio.volumeControl.settings,
                                                                    maxVolume: {
                                                                        ...s.audio.volumeControl.settings.maxVolume,
                                                                        time: [hours, minutes]
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    })
                                                },
                                                {
                                                    type: "property",
                                                    label: "DAY VOLUME",

                                                    values: [
                                                        ...generateNumberItems(100, 0, 1, (s, val) => ({
                                                            ...s,
                                                            audio: {
                                                                ...s.audio,
                                                                volumeControl: {
                                                                    ...s.audio.volumeControl,
                                                                    settings: {
                                                                        ...s.audio.volumeControl.settings,
                                                                        maxVolume: {
                                                                            ...s.audio.volumeControl.settings.maxVolume,
                                                                            volume: val,
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }), (s, val) => s.audio.volumeControl.settings.maxVolume.volume === val)
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            type: "block",
                                            label: "NIGHT VOL CNTRL",

                                            innerOptions: [
                                                {
                                                    type: "property",
                                                    label: "NIGHT TIME",

                                                    valueType: "input",
                                                    subType: "time",

                                                    initialValue: (s) => s.audio.volumeControl.settings?.minVolume.time || [0, 0],

                                                    onInput: (s, hours, minutes) => ({
                                                        ...s,
                                                        audio: {
                                                            ...s.audio,
                                                            volumeControl: {
                                                                ...s.audio.volumeControl,
                                                                settings: {
                                                                    ...s.audio.volumeControl.settings,
                                                                    minVolume: {
                                                                        ...s.audio.volumeControl.settings.minVolume,
                                                                        time: [hours, minutes]
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    })
                                                },
                                                {
                                                    type: "property",
                                                    label: "NIGHT VOLUME",

                                                    values: [
                                                        ...generateNumberItems(100, 0, 1, (s, val) => ({
                                                            ...s,
                                                            audio: {
                                                                ...s.audio,
                                                                volumeControl: {
                                                                    ...s.audio.volumeControl,
                                                                    settings: {
                                                                        ...s.audio.volumeControl.settings,
                                                                        minVolume: {
                                                                            ...s.audio.volumeControl.settings.minVolume,
                                                                            volume: val,
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }), (s, val) => s.audio.volumeControl.settings.minVolume.volume === val)
                                                    ]
                                                }
                                            ]
                                        }
                                    ],

                                    // valueType: "input",

                                    // initialValue: (s) => s.audio.volumeControl.
                                }
                            ]
                        },
                        // {
                        //     type: "property",
                        //     label: "VOLUME CONTROL",

                        //     values: [
                        //         {
                        //             label: "NONE",
                        //             onSelect: (s) => ({
                        //                 ...s,
                        //                 audio: {
                        //                     ...s.audio,
                        //                     volumeControl: "NONE",
                        //                 }
                        //             }),
                        //             reference: (s) => s.audio.volumeControl === 'NONE',

                        //             shortPropName: "VOL CONTROL",
                        //         },
                        //         {
                        //             label: "AUTO",
                        //             onSelect: (s) => ({
                        //                 ...s,
                        //                 audio: {
                        //                     ...s.audio,
                        //                     volumeControl: "AUTO",
                        //                 }
                        //             }),
                        //             reference: (s) => s.audio.volumeControl === 'AUTO',

                        //             shortPropName: "VOL CONTROL",
                        //         }
                        //     ]
                        // },
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
                {
                    type: "block",
                    label: "ADVANCED",

                    innerOptions: [
                        {
                            type: "block",
                            label: "AUTO-ON-OFF",

                            innerOptions: [
                                {
                                    type: "block",
                                    label: "AUTO POWER ON",

                                    innerOptions: [
                                        {
                                            type: "property",
                                            label: "AUTO-ON ON/OFF",

                                            values: [
                                                {
                                                    label: "ON",
                                                    onSelect: (s) => ({
                                                        ...s,
                                                        advanced: {
                                                            ...s.advanced,
                                                            autoOnOff: {
                                                                ...s.advanced.autoOnOff,
                                                                autoON: {
                                                                    ...s.advanced.autoOnOff.autoON,
                                                                    active: true
                                                                }
                                                            }
                                                        }
                                                    }),

                                                    reference: (s) => s.advanced.autoOnOff.autoON.active,
                                                    shortPropName: "AUTO-ON",
                                                },
                                                {
                                                    label: "OFF",
                                                    onSelect: (s) => ({
                                                        ...s,
                                                        advanced: {
                                                            ...s.advanced,
                                                            autoOnOff: {
                                                                ...s.advanced.autoOnOff,
                                                                autoON: {
                                                                    ...s.advanced.autoOnOff.autoON,
                                                                    active: false
                                                                }
                                                            }
                                                        }
                                                    }),

                                                    reference: (s) => !s.advanced.autoOnOff.autoON.active,
                                                    shortPropName: "AUTO-ON",
                                                }
                                            ]
                                        },
                                        {
                                            type: "property",
                                            label: "AUTO-ON TIME",

                                            shortPropName: "AUTO-ON AT",

                                            valueType: "input",
                                            subType: "time",

                                            onInput: (settings, h, m) => ({
                                                ...settings,
                                                advanced: {
                                                    ...settings.advanced,
                                                    autoOnOff: {
                                                        ...settings.advanced.autoOnOff,
                                                        autoON: {
                                                            ...settings.advanced.autoOnOff.autoON,
                                                            time: [h, m]
                                                        }
                                                    }
                                                }
                                            }),

                                            initialValue: (s) => s.advanced.autoOnOff.autoON.time
                                        }
                                    ]
                                },
                                {
                                    type: "block",
                                    label: "AUTO POWER OFF",

                                    innerOptions: [
                                        {
                                            type: "property",
                                            label: "AUTO-OFF ON/OFF",

                                            values: [
                                                {
                                                    label: "ON",
                                                    onSelect: (s) => ({
                                                        ...s,
                                                        advanced: {
                                                            ...s.advanced,
                                                            autoOnOff: {
                                                                ...s.advanced.autoOnOff,
                                                                autoOFF: {
                                                                    ...s.advanced.autoOnOff.autoOFF,
                                                                    active: true
                                                                }
                                                            }
                                                        }
                                                    }),

                                                    reference: (s) => s.advanced.autoOnOff.autoOFF.active,
                                                    shortPropName: "AUTO-OFF",
                                                },
                                                {
                                                    label: "OFF",
                                                    onSelect: (s) => ({
                                                        ...s,
                                                        advanced: {
                                                            ...s.advanced,
                                                            autoOnOff: {
                                                                ...s.advanced.autoOnOff,
                                                                autoOFF: {
                                                                    ...s.advanced.autoOnOff.autoOFF,
                                                                    active: false
                                                                }
                                                            }
                                                        }
                                                    }),

                                                    reference: (s) => !s.advanced.autoOnOff.autoOFF.active,
                                                    shortPropName: "AUTO-OFF",
                                                }
                                            ]
                                        },
                                        {
                                            type: "property",
                                            label: "AUTO-OFF TIME",

                                            shortPropName: "AUTO-OFF AT",

                                            valueType: "input",
                                            subType: "time",

                                            onInput: (settings, h, m) => ({
                                                ...settings,
                                                advanced: {
                                                    ...settings.advanced,
                                                    autoOnOff: {
                                                        ...settings.advanced.autoOnOff,
                                                        autoOFF: {
                                                            ...settings.advanced.autoOnOff.autoOFF,
                                                            time: [h, m]
                                                        }
                                                    }
                                                }
                                            }),

                                            initialValue: (s) => s.advanced.autoOnOff.autoOFF.time
                                        }
                                    ]
                                }
                            ]
                        }
                        // {
                        //     type: "block",
                        //     label: "USB",

                        //     innerOptions: [
                        //         {
                        //             type: "property",
                        //             label: "TAG DISPLAY",

                        //             values: [
                        //                 {
                        //                     label: "ON",
                        //                     onSelect: (s) => ({
                        //                         ...s,
                        //                         advanced: {
                        //                             ...s.advanced,
                        //                             usb: {
                        //                                 ...s.advanced.usb,
                        //                                 tagDisplay: true
                        //                             }
                        //                         }
                        //                     }),
                        //                     reference: (s) => s.advanced.usb.tagDisplay,
                        //                     // shortPropName: "TAG DISP",
                        //                 },
                        //                 {
                        //                     label: "OFF",
                        //                     onSelect: (s) => ({
                        //                         ...s,
                        //                         advanced: {
                        //                             ...s.advanced,
                        //                             usb: {
                        //                                 ...s.advanced.usb,
                        //                                 tagDisplay: false
                        //                             }
                        //                         }
                        //                     }),
                        //                     reference: (s) => !s.advanced.usb.tagDisplay,
                        //                     // shortPropName: "TAG DISP",
                        //                 }
                        //             ],
                        //         }
                        //     ]
                        // },
                        // {
                        //     type: "block",
                        //     label: "INTERNET RADIO",

                        //     innerOptions: [
                        //         {
                        //             type: "property",


                        //         }
                        //     ]
                        // }
                    ]
                }
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
                dataDisplay: {
                    mode: "DEFAULT",
                    interval: 10,
                },
            },
            audio: {
                volumeControl: {
                    on: false,
                    settings: {
                        maxVolume: {
                            time: [9, 0],
                            volume: 100,
                        },
                        minVolume: {
                            time: [0, 0],
                            volume: 25,
                        },
                    }
                },
                beeper: {
                    on: true,
                    volume: 1
                }
            },

            advanced: {
                autoOnOff: {
                    autoON: {
                        active: false,
                        time: [0, 0]
                    },
                    autoOFF: {
                        active: false,
                        time: [0, 0]
                    },
                },
                usb: {
                    tagDisplay: true,
                },
            },

            playMode: {

            },

            equalizer: {
                on: false,
                preset: 'FLAT',
                bands: {
                    low: { frequency: 100, gain: 0, q: 1.0 },
                    mid: { frequency: 1000, gain: 0, q: 1.0 },
                    high: { frequency: 6000, gain: 0, q: 1.0 },
                },
            },
        },

        autoOnOffMenu: {
            navigation: {
                _settingsBeforeUpdate: null,
                openedIdxArray: [],
                currentIdx: 0,
                timerBeforeClose: (30 * 60),
            },
            options: {
                autoON: [
                    {
                        type: "button",
                        label: "CANCEL AUTO-ON",
                        onClick: () => {
                            if (controllerOutputsRef.current.autoOnOff?.ON) {
                                controllerOutputsRef.current.autoOnOff.ON = {
                                    ...controllerOutputsRef.current.autoOnOff.ON,
                                    activated: false,
                                    buttonIndication: false,
                                    isInterrupted: false,
                                };

                                controllerOutputsRef.current.powerOn = false;

                            }
                        }
                    },
                    {
                        type: "button",
                        label: "CONFIRM AUTO-ON",
                        onClick: () => {
                            if (controllerOutputsRef.current.autoOnOff?.ON) {
                                controllerOutputsRef.current.autoOnOff.ON = {
                                    ...controllerOutputsRef.current.autoOnOff.ON,
                                    activated: false,
                                    buttonIndication: false,
                                    isInterrupted: false,
                                };

                                controllerOutputsRef.current.powerOn = true;
                            }
                        }
                    }
                ],
                autoOFF: [
                    {
                        type: "button",
                        label: "CANCEL AUTO-OFF",
                        onClick: () => {
                            if (controllerOutputsRef.current.autoOnOff?.OFF) {
                                controllerOutputsRef.current.autoOnOff.OFF = {
                                    ...controllerOutputsRef.current.autoOnOff.OFF,
                                    activated: false,
                                    // buttonIndication: false,
                                    isInterrupted: false,
                                };

                                controllerOutputsRef.current.powerOn = true;
                            }
                        }
                    },
                    {
                        type: "button",
                        label: "CONFIRM AUTO-OFF",
                        onClick: () => {
                            if (controllerOutputsRef.current.autoOnOff?.OFF) {
                                controllerOutputsRef.current.autoOnOff.OFF = {
                                    ...controllerOutputsRef.current.autoOnOff.OFF,
                                    activated: false,
                                    // buttonIndication: false,
                                    isInterrupted: false,
                                };

                                controllerOutputsRef.current.powerOn = false;
                            }
                        }
                    }
                ],
            },
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