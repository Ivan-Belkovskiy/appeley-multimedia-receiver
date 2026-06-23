'use client';

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import Display, { DisplayMainIndication, DisplayOtherIndication } from "./Display/Display";
import "./FrontPanel.css";
import { MainControllerInputs, MainControllerOutputs, MainControllerSource, MainControllerSources } from "../MainController/MainController";
import { centerMainText } from "@/utils/display";
import { formatTime, timeFromDate } from "@/utils/time";
import beeper from "@/utils/beeper";

interface DisplayData {
    main: DisplayMainIndication[];
    topLeft?: DisplayMainIndication[];
    otherIndication?: DisplayOtherIndication;
}

type DemoAnimationType = "default" | "scroll-left";

interface DemoIndicationOption<T = string> {
    active: (animTimer: number) => boolean;
    data: ((animTimer: number) => T) | T;
}

interface DemoInfo {
    // beforeAnimation?: {
    //     main: DisplayMainIndication[];
    //     topLeft: DisplayMainIndication[];
    //     otherIndication: DisplayOtherIndication;
    // };
    // main?: DemoIndicationOption[];
    main?: string;
    topLeft?: DemoIndicationOption<DisplayMainIndication[]>[];
    otherIndication?: DemoIndicationOption<DisplayOtherIndication>[];

    animation: DemoAnimationType;
    delayBeforeNext: number;
}

export default function FrontPanel({
    mainControllerInputsRef,
    mainControllerOutputsRef,

}: {
    mainControllerInputsRef: RefObject<MainControllerInputs>,
    mainControllerOutputsRef: RefObject<MainControllerOutputs>

}) {

    const [displayData, setDisplayData] = useState<DisplayData>({
        main: []
    });

    const displayDataRef = useRef<DisplayData>({
        main: []
    }); // For access in requestAnimationFrame()

    const updateDisplayData = (data: DisplayData) => {
        displayDataRef.current = data;
        setDisplayData(data);
    }

    const mainInputs = mainControllerInputsRef.current;
    const mainOutputs = mainControllerOutputsRef.current;


    const [outputValues, setOutputValues] = useState<MainControllerOutputs>(mainOutputs);

    const demoTopLeftAnimCallback = useCallback((t: number, startPoint: number = 37) => {
        // return String(t).split('')

        const segmentMap = [
            [1, 2, 3, 4],
            [19, 20, 21],
            [28, 29, 30],
            [9, 10, 11, 12],
            [22, 23, 24],
            [13, 14, 15],
            [1, 2, 3, 4]
        ];


        let data: DisplayMainIndication[] = ["", "", "", ""];
        const offset = Math.floor((t - startPoint) / 1);

        // const animMap = [
        //     // [indicator, [...segments] ],
        //     [2, [0, 1, 2, 3, 4, 5, 6] ],
        //     [3, [0, 1, 2, 3] ],
        //     [2, [3]],
        //     [1, [3, 4, 5, 6]],
        //     [2, [6, 7]] // 7 - for empty segment
        // ]

        const animMap = [
            // [indicator, segment ],
            [2, 0],
            [2, 1],
            [2, 2],
            [2, 3],
            [2, 4],
            [2, 5],
            [2, 6],
            [3, 0],
            [3, 1],
            [3, 2],
            [3, 3],
            [2, 3],
            [1, 3],
            [1, 4],
            [1, 5],
            [1, 6],
            [2, 6],
            [2, 7],
            [2, 7],
            [2, 7],
            [2, 7],
            [2, 7],
            [2, 7],
            [2, 7],
            [2, 7],
        ]

        const currentIndicator = animMap[(offset % animMap.length)]?.[0];

        if (t > startPoint) data[currentIndicator] = {
            directDisplay: true,
            segments: segmentMap[
                animMap[(offset % animMap.length)]?.[1]
            ] || []
            // segments: [1, 2, 3, 4]
        }
        return data;
    }, []);

    const demoInfo: DemoInfo[] = [
        {
            main: "DEMO",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: (t) => demoTopLeftAnimCallback(t, 37),
                }
            ],
            otherIndication: [
                {
                    active: (t) => t > 10,
                    data: {
                        topLeftDecorationLine: true
                    }
                }
            ]
        },
        {
            main: "APPELEY",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: (t) => demoTopLeftAnimCallback(t, 37),
                }
            ],
        },
        {
            main: "MULTIMEDIA",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "RECEIVER",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "",
            animation: "scroll-left",
            delayBeforeNext: 20,
            topLeft: [],
        },
        {
            main: "CD/DVD",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "FRONT AV-IN",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "BUILT-IN",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "BLUETOOTH",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "MODULE",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "",
            animation: "scroll-left",
            delayBeforeNext: 20,
            topLeft: [],
        },

        {
            main: "READY FOR",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "BOWSER ELEVATORS",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "ELEVATOR",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "VIDEO PLAYER",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "",
            animation: "scroll-left",
            delayBeforeNext: 20,
            topLeft: [],
        },
        {
            main: "AUTOMATIC",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "VOLUME",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "CONTROL",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "",
            animation: "scroll-left",
            delayBeforeNext: 20,
            topLeft: [],
        },
        {
            main: "SELECTABLE",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "INDICATION",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "COLOR",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "",
            animation: "scroll-left",
            delayBeforeNext: 20,
            topLeft: [],
        },
        {
            main: "EXTENDED",
            animation: "default",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "DISPLAY INFO",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "MANAGEMENT",
            animation: "scroll-left",
            delayBeforeNext: 115,
            topLeft: [
                {
                    active: (t) => t > 0,
                    data: demoTopLeftAnimCallback,
                }
            ],
        },
        {
            main: "",
            animation: "scroll-left",
            delayBeforeNext: 20,
            topLeft: [],
        },
        // {
        //     main: "TIME-ACTIVATED",
        //     animation: "default",
        //     delayBeforeNext: 115,
        //     topLeft: [
        //         {
        //             active: (t) => t > 0,
        //             data: demoTopLeftAnimCallback,
        //         }
        //     ],
        // },
        // {
        //     main: "POWER ON/OFF",
        //     animation: "scroll-left",
        //     delayBeforeNext: 115,
        //     topLeft: [
        //         {
        //             active: (t) => t > 0,
        //             data: demoTopLeftAnimCallback,
        //         }
        //     ],
        // },

    ];

    const [powerOn, setPowerOn] = useState(false);

    useEffect(() => {
        let frameId: number;

        const animatedSymbol = (symbol: string, idx: number, offset: number = 0) => ({
            "5": (["A", "P", "E"].includes(symbol) ? (idx > (3 + offset))
                : ["Y"].includes(symbol) ? (idx > (9 + offset)) : false),
            "7": (["A", "P", "E"].includes(symbol) ? (idx > (4 + offset))
                : ["Y"].includes(symbol) ? (idx > (8 + offset)) : false),
            "6": (["A", "P", "E"].includes(symbol) ? (idx > (5 + offset))
                : ["Y"].includes(symbol) ? (idx > (7 + offset)) : false),
            "8": (["A", "P", "E"].includes(symbol) ? (idx > (6 + offset))
                : ["Y"].includes(symbol) ? (idx > (6 + offset)) : false),

            "29": (
                ["A"].includes(symbol) ? (idx > (6 + offset))
                    : ["Y"].includes(symbol) ? (idx > (6 + offset)) : false),
            "30": (
                ["A"].includes(symbol) ? (idx > (7 + offset))
                    : ["Y"].includes(symbol) ? (idx > (5 + offset)) : false),
            "28": (
                ["A"].includes(symbol) ? (idx > (8 + offset))
                    : ["Y"].includes(symbol) ? (idx > (4 + offset)) : false),


            "22": (idx > (1 + offset) && ["A", "P", "E", "L"].includes(symbol)),
            "24": (idx > (2 + offset) && ["A", "P", "E", "L"].includes(symbol)),
            "23": (idx > (3 + offset) && ["A", "P", "E", "L"].includes(symbol)),

            "13": (["A", "P", "E", "L"].includes(symbol) ? (idx > (4 + offset))
                : ["Y"].includes(symbol) ? (idx > (9 + offset)) : false),
            "15": (["A", "P", "E", "L"].includes(symbol) ? (idx > (5 + offset))
                : ["Y"].includes(symbol) ? (idx > (10 + offset)) : false),
            "14": (["A", "P", "E", "L"].includes(symbol) ? (idx > (6 + offset))
                : ["Y"].includes(symbol) ? (idx > (11 + offset)) : false),

            "1": (idx > (6 + offset) && ["A", "P", "E"].includes(symbol)),
            "2": (idx > (7 + offset) && ["A", "P", "E"].includes(symbol)),
            "4": (idx > (8 + offset) && ["A", "P", "E"].includes(symbol)),
            "3": (idx > (9 + offset) && ["A", "P", "E"].includes(symbol)),

            "20": (
                ["A", "P"].includes(symbol) ? (idx > (9 + offset))
                    : ["Y"].includes(symbol) ? (idx > (9 + offset)) : false
            ),
            "21": (
                ["A", "P"].includes(symbol) ? (idx > (10 + offset))
                    : ["Y"].includes(symbol) ? (idx > (8 + offset)) : false
            ),
            "19": (
                ["A", "P"].includes(symbol) ? (idx > (11 + offset))
                    : ["Y"].includes(symbol) ? (idx > (7 + offset)) : false
            ),

            "9": (
                ["E", "L"].includes(symbol) ? (idx > (1 + offset))
                    : ["Y"].includes(symbol) ? (idx > (1 + offset)) : false
            ),
            "10": (
                ["E", "L"].includes(symbol) ? (idx > (2 + offset))
                    : ["Y"].includes(symbol) ? (idx > (2 + offset)) : false
            ),
            "12": (
                ["E", "L"].includes(symbol) ? (idx > (3 + offset))
                    : ["Y"].includes(symbol) ? (idx > (3 + offset)) : false
            ),
            "11": (
                ["E", "L"].includes(symbol) ? (idx > (4 + offset))
                    : ["Y"].includes(symbol) ? (idx > (4 + offset)) : false
            ),
        });

        const animatePowerOnLogo = (idx: number) => {
            const APPELEY = [
                // {
                //     // A
                //     "5": (idx > 3),
                //     "7": (idx > 4),
                //     "6": (idx > 5),
                //     "8": (idx > 6),

                //     "29": (idx > 6),
                //     "30": (idx > 7),
                //     "28": (idx > 8),


                //     "22": true,
                //     "24": (idx > 2),
                //     "23": (idx > 3),
                //     "13": (idx > 4),
                //     "15": (idx > 5),
                //     "14": (idx > 6),

                //     "1": (idx > 6),
                //     "2": (idx > 7),
                //     "4": (idx > 8),
                //     "3": (idx > 9),

                //     "20": (idx > 9),
                //     "21": (idx > 10),
                //     "19": (idx > 11),
                // },
                animatedSymbol("A", idx),
                animatedSymbol("P", idx),
                animatedSymbol("P", idx),
                animatedSymbol("E", idx),
                animatedSymbol("L", idx),
                animatedSymbol("E", idx),
                animatedSymbol("Y", idx),
            ];

            updateDisplayData({
                ...displayData,
                main: [...["", "", "", ""], ...APPELEY.map(s => ({
                    directDisplay: true,
                    segments: Object.entries(s).filter(e => e[1] === true).map(e => Number(e[0]))
                })), ...["", "", "", "", "", "", "", ""]] as DisplayMainIndication[]
            });
            // setDisplayData({
            //     ...displayData,
            //     main: ["", "", "", "", {
            //         directDisplay: true,
            //         segments: [22]
            //     }, "P", "P", "E", "L", "E", "Y", "", "", "", "", ""]
            // });
        }

        const animateSourceSelect = (animT: number) => {
            updateDisplayData({
                main: (
                    displayDataRef.current.main.map((s, idx) => {
                        if (animT > 2 && animT < 16) {
                            if (idx < 8) {
                                if ((animT - 1) === idx) return [""];
                                if (animT === idx) return {
                                    directDisplay: true,
                                    segments: [7, 6]
                                };
                            }
                            if (idx >= 8) {
                                if (((15 - animT) + 1) === idx) return [""];
                                if ((15 - animT) === idx) return {
                                    directDisplay: true,
                                    segments: [7, 6]
                                };
                            }
                        }
                        return s;
                    })
                )
            });
        }

        let displayAction: string | null = "INIT";
        let animTimer = 0;
        let updateTimer = 0;

        let scrollPosition = 0;

        let displayingSource = mainOutputs.currentSource;

        let isDemoAnimating = false;
        let demoPosition = 0;
        let demoTimer = 0;
        let nextDemoTimer = 0;

        let clickedButton: string | null = null;

        let displayMode: {
            folder: number | null;
            _folder?: number | null;
            track: number | null;
            _track?: number | null;
            default?: boolean | null;
            clockTime?: boolean | null;

            _volume?: number;
            volume?: boolean;

            dynamic?: boolean;


            selectedSource?: MainControllerSources;
            playTrackAfterSrcSelect?: boolean;

        } = {
            folder: null,
            track: null,

            _volume: mainOutputs.mainVolume,

            selectedSource: mainOutputs.currentSource
        };

        const resetDemo = () => {
            isDemoAnimating = false;
            mainInputs.isDemoAnimating = false;
            demoPosition = 0;
            demoTimer = ((mainOutputs.settings?.demo?.interval ?? 20) * 60);
        }

        resetDemo();

        const updateDisplayAction = (data: string | null) => {
            displayAction = data;
            animTimer = 0;
            updateTimer = 0;
        }

        const animateScrollingText = (animT: number, data: string, returnCallback: () => void) => {
            let dispTxt = data;

            if (animT < (60 * 5)) {
                scrollPosition = 0;
            } else if (dispTxt.length > 16) {
                if (((animT - (60 * 5)) % 15 === 0)) {
                    scrollPosition++;
                    if (scrollPosition > (
                        dispTxt.length
                    )) returnCallback();
                }
            } else returnCallback();


            updateDisplayData({
                ...displayDataRef.current,
                main: dispTxt.slice(scrollPosition).split(''),
            });

            // animT++;
        }

        const animateTopLeftSelection = (updTimer: number) => {
            let t = ((updTimer % (6)) + 1);

            updateDisplayData({
                ...displayDataRef.current,
                topLeft: [
                    {
                        directDisplay: true,
                        segments: (
                            (t === 1) ? [1, 2, 3, 4] :
                                (t === 4) ? [9, 10, 11, 12] :
                                    (t === 5) ? [22, 23, 24] :
                                        (t === 6) ? [13, 14, 15] : []
                        )
                    },
                    {
                        directDisplay: true,
                        segments: (
                            (t === 2) ? [1, 2, 3, 4] :
                                (t === 3) ? [9, 10, 11, 12] : []
                        )
                    },
                    {
                        directDisplay: true,
                        segments: (
                            (t === 3) ? [1, 2, 3, 4] :
                                (t === 2) ? [9, 10, 11, 12] : []
                        )
                    },
                    {
                        directDisplay: true,
                        segments: (
                            (t === 1) ? [9, 10, 11, 12] :
                                (t === 4) ? [1, 2, 3, 4] :
                                    (t === 5) ? [19, 20, 21] :
                                        (t === 6) ? [28, 29, 30] : []
                        )
                    }
                ]
            })
        }

        let _currentLift: number | null = null;

        const demoTransition = (anim: DemoAnimationType = "default", timer: number, position: number, onEnded?: () => void) => {
            const t = timer;
            // const t = Math.floor(timer / 4);

            if (displayDataRef.current.main.length < 15) {
                // Init
                updateDisplayData({
                    ...displayDataRef.current,
                    main: Array(16).fill(''),
                    otherIndication: {}
                });
            }

            if (anim === 'default') {
                updateDisplayData({
                    ...displayDataRef.current,
                    main: displayDataRef.current.main.map((s: DisplayMainIndication, idx) => {
                        let segments: number[] = [];

                        // Left-Right Animated Segments
                        if (t > 15 && t < 19) {

                            if (
                                [16, 17, 18].includes(t) &&
                                (idx === 0 || idx === 15)
                            ) {
                                segments = Array((
                                    t < 17 ? ((t - 16) + 1) * 3 : 3
                                )).fill(0).map((v, i) => (
                                    (((i % 3) + (idx === 0 ? 13 : 28)) + ((idx === 0 ? 9 : -9) * (Math.floor(i / 3))))
                                ));
                            }

                        }

                        // Center Segments in animation
                        if (
                            [
                                (16 / 2) + 0,
                                (16 / 2) - 1,
                                // (16 / 2 + 2)
                            ].includes(idx) &&
                            [
                                (16 / 2) + 0,
                                (16 / 2) + 1,
                                // (16 / 2 + 2)
                            ].includes(t)
                        ) return {
                            directDisplay: true,
                            segments: [
                                1, 2, 3, 4,
                                9, 10, 11, 12
                            ]
                        };

                        if (t > 17) {

                            if ((t - 18) > ((16 / 2) + 1)) {

                                if (idx === ((t - 18) - 2) || (15 - idx) === ((t - 18) - 2)) {
                                    return {
                                        directDisplay: true,
                                        segments: [...segments, 6, 7],
                                    };
                                } else {
                                    // alert(t);
                                    if (
                                        // (15 - idx) < ((t - 18) - 2) && ( idx <= (16 / 2) ) ||
                                        (15 - idx) < (t - 20) && (idx <= (16 / 2))/* ||*/
                                        || (idx) < (t - 20) && (idx >= (16 / 2))
                                        /*(idx) >= (7 + (t - 30)) && ( idx > (16 / 2)  )*/
                                    ) {
                                        return centerMainText(demoInfo[position]?.main || "")?.[idx] || "";
                                    } else return "";
                                }

                                // if (idx === ((t - 18) - 2)) {
                                //     return "";
                                //     // return (idx > (16 / 2)) ? centerMainText(demoInfo[position].main || "")?.[idx] : "";
                                // } else if ((15 - idx) === ((t - 18) - 1)) {
                                //     return "";
                                //     // return (idx <= (16 / 2)) ? centerMainText(demoInfo[position].main || "")?.[idx] : "";
                                // } else {
                                //     return centerMainText(demoInfo[position]?.main || "")?.[idx];
                                // }

                            } else {

                                if (
                                    (idx === (t - 18) && (t - 18) < 8) ||
                                    idx === ((t - 18) - 1) ||
                                    (idx === ((t - 18) - 2))

                                    ||

                                    ((15 - idx) === (t - 18) && (t - 18) < 8) ||
                                    (15 - idx) === ((t - 18) - 1) ||
                                    ((15 - idx) === ((t - 18) - 2))
                                ) {
                                    return {
                                        directDisplay: true,
                                        segments: [...segments, 5, 6, 7, 8],
                                    };
                                }

                            }

                        } else {
                            if (
                                idx === t ||
                                idx === (t - 1) ||
                                idx === (t - 2)
                            ) {
                                return {
                                    directDisplay: true,
                                    segments: [...segments, 9, 10, 11, 12],
                                };
                            }

                            if (
                                (15 - idx) === t ||
                                (15 - idx) === (t - 1) ||
                                (15 - idx) === (t - 2)
                            ) {
                                return {
                                    directDisplay: true,
                                    segments: [...segments, 1, 2, 3, 4]
                                };
                            }

                            if (
                                // t > 0
                                (idx) <= (t - 0) ||
                                (idx) >= (15 - t)
                                // (15 - idx) < (t - 3) ||
                                // (idx) < (t - 3)
                            ) {
                                return "";
                            }
                        }

                        if (t > 8) return "";
                        // return displayDataRef.current.main[idx];
                        return centerMainText(demoInfo[position - 1]?.main || "")?.[idx];
                    }),
                });
            } else {
                if (t < 1) {
                    const prev = centerMainText(demoInfo[position - 1].main || "");
                    const next = centerMainText(demoInfo[position].main || "");
                    updateDisplayData({
                        ...displayDataRef.current,
                        main: [...prev, ...next]
                    });
                } else if (displayDataRef.current.main.length > 16) updateDisplayData({
                    ...displayDataRef.current,
                    main: displayDataRef.current.main.slice(1, displayDataRef.current.main.length),
                    // main: displayDataRef.current.main.map((s, i) => {
                    //     // const prev = centerMainText(demoInfo[position - 1].main || "");
                    //     // const next = centerMainText(demoInfo[position].main || "");
                    //     return displayDataRef.current.main[i + 1] || "";
                    // })
                }); else {
                    updateDisplayData({
                        ...displayDataRef.current,
                        main: displayDataRef.current.main.slice(0, 16)
                    });
                    onEnded?.();
                }
                // if (t > 16) {

                // }
            }
        }

        // demoTimer = 0;

        const animateDemo = (updTimer: number = 0) => {


            const current = demoInfo[demoPosition];


            if (current?.topLeft) {
                current.topLeft.forEach((opt) => {
                    if (opt.active(demoTimer)) {
                        updateDisplayData({
                            ...displayDataRef.current,
                            topLeft: (
                                // typeof opt.data === 'string' ? opt.data.split('')
                                typeof opt.data === 'function' ? opt.data(demoTimer) :
                                    Array.isArray(opt.data) ? opt.data : opt.data
                            ),
                        });
                    }
                });
            }

            if (current?.otherIndication) {
                current.otherIndication.forEach((opt) => {
                    if (opt.active(demoTimer)) {
                        updateDisplayData({
                            ...displayDataRef.current,
                            otherIndication: typeof opt.data === 'function' ? opt.data(demoTimer) : opt.data,
                        });
                    }
                });
            }



            if (nextDemoTimer > 0) {
                nextDemoTimer--;
                if (nextDemoTimer === 0) {
                    demoTimer = 0;
                    demoPosition++;
                }
                else if (updTimer % 7 === 0) demoTimer++;
            } else if (demoTimer < 38) {

                if (updTimer % 4 === 0) {
                    demoTransition(current?.animation || "default", demoTimer, demoPosition, () => {
                        demoTimer = 38;
                    });
                    demoTimer++;
                }

            } else {
                if (demoInfo[demoPosition]) nextDemoTimer = demoInfo[demoPosition].delayBeforeNext;
                else {
                    resetDemo();
                    updateDisplayData({
                        main: [],
                        topLeft: [],
                        otherIndication: {}
                    });
                };
                // demoPosition++;
            }

            // if (current.main) {
            //     current.main.forEach((opt) => {
            //         if (opt.active(demoTimer)) {
            //             updateDisplayData({
            //                 ...displayDataRef.current,
            //                 main: centerMainText(opt.data),
            //             })
            //         }
            //     });
            // }


            // if (current?.topLeft) {
            //     current.topLeft.forEach((opt) => {
            //         if (opt.active(demoTimer)) {
            //             updateDisplayData({
            //                 ...displayDataRef.current,
            //                 topLeft: (
            //                     // typeof opt.data === 'string' ? opt.data.split('')
            //                     typeof opt.data === 'function' ? opt.data(demoTimer) :
            //                         Array.isArray(opt.data) ? opt.data : opt.data
            //                 ),
            //             });
            //         }
            //     });
            // }

            // if (current?.otherIndication) {
            //     current.otherIndication.forEach((opt) => {
            //         if (opt.active(demoTimer)) {
            //             updateDisplayData({
            //                 ...displayDataRef.current,
            //                 otherIndication: typeof opt.data === 'function' ? opt.data(demoTimer) : opt.data,
            //             });
            //         }
            //     });
            // }

            // demoTimer++;
        }

        const update = () => {

            // setDisplayData({
            //     ...displayData,
            //     main: ["", "", "", "", "A", "P", "P", "E", "L", "E", "Y", "", "", "", "", ""]
            // });

            setPowerOn(mainOutputs.powerOn === true);

            // setOutputValues(mainOutputs);

            // if (typeof outputValues === 'undefined') setOutputValues(mainOutputs);
            // else {

            // if (mainOutputs.powerOn) {
            // alert(updateTimer);
            // setOutputValues({
            //     powerOn: mainOutputs.powerOn
            // });

            // animateDemo(updateTimer);

            if (mainOutputs.powerOn) {

                if (mainOutputs.resetDemo) {
                    resetDemo();
                    mainOutputs.resetDemo = false;
                }

                if (displayAction !== "INIT") {
                    if (displayingSource !== mainOutputs.currentSource) {
                        updateDisplayAction('SOURCE DISP');
                        displayingSource = mainOutputs.currentSource;
                    }
                }

                if (displayAction === "INIT") {

                    if (updateTimer > 20) {

                        if (updateTimer < 140) {
                            animatePowerOnLogo(Math.floor((updateTimer - 20) / 1));
                            animTimer = 0;
                        } else if (animTimer < 14) {
                            if (updateTimer % 5 === 0) {
                                updateDisplayData({
                                    main: (
                                        displayDataRef.current.main.map((s, idx) => {
                                            if (animTimer > 2 && animTimer < 16) {
                                                if (idx <= 8) {
                                                    if ((animTimer - 1) === idx) return [""];
                                                    if (animTimer === idx) return {
                                                        directDisplay: true,
                                                        segments: [7, 6]
                                                    };
                                                }
                                                if (idx > 8) {
                                                    if (((15 - animTimer) + 1) === idx) return [""];
                                                    if ((15 - animTimer) === idx) return {
                                                        directDisplay: true,
                                                        segments: [7, 6]
                                                    };
                                                }
                                            }
                                            return s;
                                        })
                                    )
                                });
                                animTimer++;
                            }
                        } else if (animTimer >= 14) {
                            animTimer++;
                            if (animTimer > 19) {
                                animTimer = 0;
                                updateTimer = 0;
                                displayAction = 'SOURCE DISP';
                            }
                        };
                        // setDisplayData({
                        //     ...displayData,
                        //     main: ["", "", "", "", "A", "P", "P", "E", "L", "E", "Y", "", "", "", "", ""]
                        // });
                    } else setDisplayData({
                        main: []
                        // main: mainOutputs.display.mainData?.split('') || []
                    });
                } else if (displayAction === 'SOURCE DISP') {
                    if (updateTimer < 100) {
                        if (typeof mainOutputs.currentSource === 'number') updateDisplayData({
                            main: centerMainText(
                                MainControllerSources[mainOutputs.currentSource]
                            ),
                            // main: centerMainText(mainOutputs.currentSource),
                        });
                    } else {
                        if (updateTimer % 5 === 0) {
                            if (animTimer < 13) animateSourceSelect(animTimer);
                            else {
                                mainInputs.sourceData[1].allowReading = false;
                                if (mainOutputs.currentSource === 1) mainInputs.sourceData[1].allowReading = true;
                                // else {
                                // }
                                updateDisplayAction(`MAIN INFO`);
                            }
                            animTimer++;
                        }
                    }


                } else if (displayAction?.startsWith('MAIN INFO')) {

                    if (mainOutputs.sourceData[1].dataToLoad && mainOutputs.currentSource === 1) {
                        displayMode.playTrackAfterSrcSelect = true;
                        displayMode.volume = false;
                        displayMode._volume = mainOutputs.mainVolume;
                    }

                    if (mainOutputs.resetAnimationsTimer?.animTimer) {
                        animTimer = 0;
                        mainOutputs.resetAnimationsTimer.animTimer = false;
                    }

                    if (mainInputs.buttons?.disp) {
                        if (clickedButton !== 'disp') {
                            beeper.singleBeep(1);
                            if (isDemoAnimating) resetDemo();
                            else {
                                if (mainOutputs.currentSource === 1) {

                                    // if (mainOutputs.sourceData[1].playbackData) {

                                    //     if (displayMode.folder !== mainOutputs.sourceData[1].playbackData?.folderNumber) {
                                    //         displayMode.folder = mainOutputs.sourceData[1].playbackData.folderNumber;
                                    //         displayMode.track = null;
                                    //     }

                                    //     if (displayMode.track !== mainOutputs.sourceData[1].playbackData?.trackNumber) {
                                    //         // displayMode.folder = null;
                                    //         displayMode.track = mainOutputs.sourceData[1].playbackData.trackNumber;
                                    //     }

                                    // }

                                    if (displayMode.volume) {
                                        displayMode.volume = false;
                                    } else if (displayMode.folder === null && mainOutputs.sourceData[1].playbackData) {
                                        displayMode = {
                                            folder: mainOutputs.sourceData[1].playbackData.folderNumber,
                                            track: null,

                                            _folder: displayMode._folder,
                                            _track: displayMode._track,

                                            _volume: mainOutputs.mainVolume,

                                        };
                                        animTimer = 0;
                                    } else if (displayMode.track === null && mainOutputs.sourceData[1].playbackData) {
                                        displayMode.track = mainOutputs.sourceData[1].playbackData.trackNumber;
                                        displayMode.default = true;
                                        animTimer = 0;
                                    } else if (displayMode.default) {
                                        displayMode.default = false;
                                        displayMode.clockTime = true;
                                    } else {
                                        displayMode.folder = null;
                                    }
                                    displayMode.selectedSource = mainOutputs.currentSource;
                                }
                            }
                        }

                        clickedButton = 'disp';
                    } else if (clickedButton === 'disp') clickedButton = null;

                    if (isDemoAnimating) {
                        animateDemo(updateTimer);
                    } else {

                        if ([1, 2].includes(mainOutputs.currentSource || 0)) updateDisplayData({
                            ...displayDataRef.current,
                            topLeft: (typeof mainOutputs.currentSource === 'number') ? (
                                MainControllerSources[mainOutputs.currentSource]
                            ).split('') : []
                        });

                        if (displayMode.selectedSource !== mainOutputs.currentSource) {
                            if (mainOutputs.currentSource === 1) {
                                displayMode = {
                                    folder: null,
                                    track: null,
                                    playTrackAfterSrcSelect: (mainOutputs.sourceData[1].playbackData?.isPlaying) ? true : false,
                                    // playTrackAfterSrcSelect: true,
                                }
                            }
                            displayMode.selectedSource = mainOutputs.currentSource;
                        }

                        if (mainOutputs.discState) {
                            // if (mainOutputs.discState === 'eject') {
                            updateDisplayData({
                                main: centerMainText(mainOutputs.discState),
                                topLeft: [],
                                otherIndication: {}
                            });
                            // }
                        } else {
                            if (mainOutputs.currentSource === 0) {
                                // CD/DVD

                                updateDisplayData({
                                    ...displayDataRef.current,
                                    main: centerMainText("NO DISC"),
                                    topLeft: []
                                });
                            } else if (mainOutputs.currentSource === 1) {
                                // USB
                                const sourceData = mainOutputs.sourceData?.[1];

                                if (sourceData.menu?.menuType === 'navigation') {

                                    displayMode.volume = false;

                                    if (sourceData.menu.error) {
                                        updateDisplayData({
                                            main: centerMainText(sourceData.menu.error),
                                            topLeft: [],
                                            otherIndication: {
                                                topLeftDecorationLine: true
                                            },
                                        });
                                    } else {

                                        const data = (sourceData.menu.subCategory === 'file' && typeof sourceData.menu.subIndex === 'number') ? (
                                            sourceData.navigationData?.[sourceData.menu.mainIndex].trackList[
                                            sourceData.menu.subIndex
                                            ] || ""
                                        ) : (
                                            sourceData.navigationData?.[sourceData.menu.mainIndex].name || ""
                                        );

                                        updateDisplayData({
                                            main: [],
                                            topLeft: (sourceData.menu.subCategory === 'file' ? 'FILE' : 'LIST').split(''),
                                            otherIndication: {
                                                topLeftDecorationLine: true
                                            },
                                        });

                                        animateScrollingText(animTimer, data, () => {
                                            animTimer = 0;
                                        });

                                        animTimer++;
                                    }


                                    // animateTopLeftSelection(Math.floor((updateTimer / 30)));

                                } else if (sourceData?.playbackData) {
                                    const trackNumber = String(sourceData.playbackData.trackNumber + 1).padStart(3, "0");
                                    const folderNumber = String(sourceData.playbackData.folderNumber + 1).padStart(2, "0").padStart(3, "F");

                                    const trackName = sourceData.playbackData.trackName;
                                    const folderName = sourceData.playbackData.albumName;
                                    const artist = sourceData.playbackData.artist;

                                    const currentTime = (trackName && sourceData.playbackData.currentTime) ? formatTime(sourceData.playbackData.currentTime) : undefined;

                                    if (displayMode._volume !== mainOutputs.mainVolume) {
                                        displayMode._volume = mainOutputs.mainVolume;
                                        displayMode.volume = true; // Activate volume disp mode; 
                                    }

                                    if (sourceData.playbackData) {
                                        if (displayMode._folder !== sourceData.playbackData.folderNumber) {
                                            displayMode.folder = null; // Reset folder disp mode;
                                            displayMode.track = null;
                                            animTimer = 0;
                                            displayMode._folder = sourceData.playbackData.folderNumber;
                                        }

                                        if (displayMode._track !== sourceData.playbackData.trackNumber) {
                                            displayMode.track = null; // Reset track disp mode;
                                            animTimer = 0;
                                            displayMode._track = sourceData.playbackData.trackNumber;
                                        }
                                    }
                                    // let main = ` ${trackNumber}`;
                                    // let topLeft = folderNumber;
                                    // let other: DisplayOtherIndication = {};
                                    if (displayMode.volume === true) {
                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            topLeft: [],
                                            otherIndication: {}
                                        })
                                        animateScrollingText(animTimer, (
                                            centerMainText(`VOLUME ${String(mainOutputs.mainVolume).padStart(2, "0")}`).join('')
                                        ), () => {
                                            animTimer = 0;
                                            displayMode.volume = false;
                                        });
                                        animTimer++;
                                    } else if (sourceData.playbackData?.isPaused) {
                                        if (updateTimer % 60 < 30) updateDisplayData({
                                            main: centerMainText('PAUSE'),
                                            topLeft: [],
                                            otherIndication: {}
                                        });
                                        else updateDisplayData({
                                            main: [],
                                            topLeft: [],
                                            otherIndication: {}
                                        });
                                    } else if (displayMode.playTrackAfterSrcSelect === true) {
                                        animateScrollingText(animTimer, (
                                            centerMainText(`PLAY ${trackNumber}`).join('')
                                        ), () => {
                                            animTimer = 0;
                                            displayMode.playTrackAfterSrcSelect = false;
                                        });

                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            topLeft: folderNumber.split(''),
                                            otherIndication: {}
                                        });

                                        animTimer++;
                                    } else if (displayMode.folder === null && folderName) {

                                        animateScrollingText(animTimer, (
                                            `${folderName} / ${artist ? artist : ''}`
                                        ), () => {
                                            animTimer = 0;
                                            displayMode.folder = sourceData.playbackData?.folderNumber || 0;
                                        });

                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            topLeft: folderNumber.split(''),
                                            otherIndication: {}
                                        });

                                        animTimer++;

                                    } else if (displayMode.track === null && trackName) {

                                        animateScrollingText(animTimer, (
                                            trackName
                                        ), () => {
                                            animTimer = 0;
                                            displayMode.track = sourceData.playbackData?.trackNumber || 0;
                                            displayMode.default = true;
                                        });

                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            topLeft: trackNumber.split(''),
                                            otherIndication: { Tr: true }
                                        });

                                        animTimer++;

                                    } else {
                                        if (displayMode.default) {
                                            const main = ` ${trackNumber}       ${currentTime ?? ""}`;

                                            updateDisplayData({
                                                ...displayDataRef.current,
                                                main: main.split(''),
                                                topLeft: folderNumber.split(''),
                                                otherIndication: {}
                                            });
                                        } else if (displayMode.clockTime) {

                                            const main = ` ${trackNumber}     ${timeFromDate(new Date(), (updateTimer % 60 > 30)) ?? ""}`;

                                            updateDisplayData({
                                                ...displayDataRef.current,
                                                main: main.split(''),
                                                topLeft: folderNumber.split(''),
                                                otherIndication: {}
                                            });
                                        }
                                    }



                                    // updateDisplayData({
                                    //     ...displayDataRef.current,
                                    //     main: main.split(''),
                                    //     topLeft: topLeft.split(''),
                                    //     otherIndication: other,
                                    // });
                                } else if (sourceData?.isReading) {

                                    if (updateTimer % 60 < 30) updateDisplayData({
                                        ...displayDataRef.current,
                                        main: centerMainText('READING'),
                                    });
                                    else updateDisplayData({
                                        ...displayDataRef.current,
                                        main: []
                                    });

                                } else if (sourceData?.error) {
                                    updateDisplayData({
                                        ...displayDataRef.current,
                                        main: centerMainText(sourceData.error),
                                    });
                                } else {
                                    updateDisplayData({
                                        ...displayDataRef.current,
                                        main: centerMainText("NO USB"),
                                        topLeft: []
                                    })
                                }
                            } else if (mainOutputs.currentSource === 5) {
                                // MyLift
                                const sourceData = mainOutputs.sourceData?.[5];
                                if (!sourceData?.connectionInfo?.ip) {
                                    updateTimer = (360 * 3);
                                    if (updateTimer < (360 * 3)) {
                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            main: [],
                                            topLeft: []
                                        });
                                        if ((updateTimer % 360) < 100) {
                                            updateDisplayData({
                                                ...displayDataRef.current,
                                                main: centerMainText("ENTER"),
                                                topLeft: []
                                            });
                                        } else if (
                                            (updateTimer % 360) > 120 &&
                                            (updateTimer % 360) < 220
                                        ) {
                                            updateDisplayData({
                                                ...displayDataRef.current,
                                                main: centerMainText("SERVER IP & PORT"),
                                                topLeft: []
                                            });
                                        } else if (
                                            (updateTimer % 360) > 240 &&
                                            (updateTimer % 360) < 340
                                        ) {
                                            updateDisplayData({
                                                ...displayDataRef.current,
                                                main: centerMainText("TO CONNECT"),
                                                topLeft: []
                                            });
                                        }
                                    } else {
                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            main: `IP ${"   .   .   . "}`.split(''),
                                            topLeft: [],
                                        })
                                    }

                                } else if (sourceData.connectionInfo.ip.indexOf(" ") > -1) {
                                    updateDisplayData({
                                        ...displayDataRef.current,
                                        main: `IP ${sourceData.connectionInfo.ip}`.split(''),
                                        topLeft: [],
                                    })
                                } else {
                                    // console.log('Connecting?: ' + sourceData.isConnecting);
                                    // console.log('Connected?: ' + sourceData.isConnected);
                                    if (sourceData.data) {

                                        if (sourceData.ui?.elevatorCategorySelection) {
                                            animateTopLeftSelection(Math.floor((updateTimer / 30)));
                                            updateDisplayData({
                                                ...displayDataRef.current,
                                                main: centerMainText("Мои Лифты")
                                            });
                                        } else if (sourceData.ui?.elevatorListSelection) {
                                            animateTopLeftSelection(Math.floor((updateTimer / 30)));

                                            if (_currentLift !== sourceData.ui.elevatorListSelection.currentLift) {
                                                _currentLift = sourceData.ui.elevatorListSelection.currentLift ?? null;
                                                animTimer = 0;
                                            }

                                            animateScrollingText(animTimer, (
                                                sourceData.data.elevators?.[
                                                    sourceData.ui.elevatorListSelection.currentLift || 0
                                                ]?.title || ""
                                            ), () => animTimer = 0);
                                            animTimer++;
                                        } else if (sourceData.ui?.selectedElevator) {
                                            updateDisplayData({
                                                main: [],
                                                topLeft: String(sourceData.ui.selectedElevator.liftNumber + 1).padStart(3, "0").split(''),
                                                otherIndication: {
                                                    Elevator: true
                                                }
                                            })
                                        }
                                        // updateDisplayData({
                                        //     ...displayDataRef.current,
                                        //     main: (
                                        //         sourceData.data.elevators?.[
                                        //             sourceData.data.elevators?.length - 2
                                        //         ]?.title || ""
                                        //     ).split('')
                                        // })
                                    } else if (sourceData.connectionError) {

                                        let dispTxt = `ERROR: ${sourceData.connectionError || ""}`;

                                        if (animTimer < (60 * 5)) {
                                            scrollPosition = 0;
                                        } else if ((animTimer - (60 * 5)) % 20 === 0) {
                                            scrollPosition++;
                                            if (scrollPosition > (
                                                dispTxt.length
                                            )) animTimer = 0;
                                        }


                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            main: dispTxt.slice(scrollPosition).split(''),
                                            topLeft: [],
                                        });

                                        animTimer++;

                                    } else if (!sourceData.isConnecting) {
                                        updateDisplayData({
                                            ...displayDataRef.current,
                                            main: `PORT: ${sourceData.connectionInfo.port || ""}`.split(''),
                                            topLeft: [],
                                        });
                                    } else if (sourceData.isConnecting === true) {
                                        if (updateTimer % 60 < 30) updateDisplayData({
                                            ...displayDataRef.current,
                                            main: centerMainText('CONNECTING'),
                                        });
                                        else updateDisplayData({
                                            ...displayDataRef.current,
                                            main: []
                                        });
                                    }
                                }
                            }
                        }



                        if (demoTimer > 0) {
                            demoTimer--;
                        } else {
                            isDemoAnimating = true;
                            mainInputs.isDemoAnimating = true;
                            demoTimer = 0;
                            demoPosition = 0;
                            updateDisplayData({
                                main: [],
                                topLeft: [],
                                otherIndication: {}
                            });
                        }
                    }

                }

                updateTimer++;

            } else {
                if (
                    displayDataRef.current.main.length ||
                    displayDataRef.current.otherIndication ||
                    displayDataRef.current.topLeft
                ) {
                    updateDisplayData({
                        main: [],
                        topLeft: [],
                        otherIndication: {}
                    });
                }

                if (displayAction !== 'INIT') {
                    displayMode = {
                        folder: null,
                        track: null,

                        // selectedSource: mainOutputs.currentSource
                    }
                    updateTimer = 0;
                    animTimer = 0;
                    isDemoAnimating = false;
                    mainInputs.sourceData[1].allowReading = false;
                    resetDemo();
                }

                displayAction = 'INIT';
            }
            // }

            // }

            // updateTimer++;

            frameId = requestAnimationFrame(update);
        };

        frameId = requestAnimationFrame(update);

        return () => cancelAnimationFrame(frameId);
    }, []);

    const setNumberButtonState = (num: number, state: boolean) => {
        mainInputs.buttons = {
            ...mainInputs.buttons,
            [`num_${num}`]: state,
        }
    }

    return (
        <div className="front-panel">
            {/* <img className="front-panel__main" src="/images/front-panel/12_version/FrontPanel_No_Display.svg" /> */}

            <svg className="front-panel__svg" version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink" width="865.18414" height="247.45516" viewBox="0,0,865.18414,247.45516">
                <defs>
                    <radialGradient cx="225.48171" cy="288.92739" r="63.40386" gradientUnits="userSpaceOnUse" id="color-1">
                        <stop offset="0" stopColor="#ffffff" />
                        <stop offset="1" stopColor="#b8b8b8" />
                    </radialGradient>
                </defs>
                <g transform="translate(-12.37299,-144.35214)">
                    <g strokeMiterlimit="10">
                        <path d="M12.50345,391.79294v-240.2927h865.05369v240.2927z" fill="#2b3439" stroke="none" strokeWidth="1" strokeLinecap="butt" />

                        {/* <path d="M270.65299,391.8073l-86.0389,-0.01116l-53.7026,-34.51702l-118.28993,-0.08201l-0.24857,-205.58319l44.06163,-0.1102l74.41117,55.25762l194.86839,-0.03695h481.49617l70.30745,-55.19783l-0.08481,240.15153l-70.22262,-34.48139l-480.78177,-0.7144z" fill="#7e7e7e" stroke="none" strokeWidth="0" strokeLinecap="butt" /> */}

                        {/* <!-- Main Top-Left Part --> */}
                        <path d="M12.50352,206.75186v-55.25162h79.7095h119.19633v55.25162z" fill="#7e7e7e" stroke="none" strokeWidth="1" strokeLinecap="butt" />

                        {/* <!-- Second Base Part --> */}
                        <path d="M91.77192,151.50024h785.78528v55.25162h-741.83367z" fill="#bebebe" stroke="none" strokeWidth="1" strokeLinecap="butt" />

                        {/* <!-- Main Base Part --> */}
                        <path d="M270.65299,391.8073l-86.0389,-0.01116l-53.7026,-34.51702l-118.28993,-0.08201l-0.14155,-117.06504l118.58924,-0.38195l52.83588,-33.00386l141.80905,-0.02686h481.49617l70.30745,-55.19783l-0.08481,240.15153l-70.22262,-34.48139l-480.78177,-0.7144z" fill="#7e7e7e" stroke="none" strokeWidth="0" strokeLinecap="butt" />



                        <image x="1325.55644" y="808.91449" transform="scale(0.27279,0.27279)" width="376" height="70" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXgAAABGCAYAAADGmo/PAAADzklEQVR4AezU0UotMQwFUPX//3mkoAjn+NB2GiZt1sBwr9JmkhXZX9dmz8fgs9l41+B4HzvNd/JsbQ9R843WzXC+eez09pr1ztRbb+Zcbw/t3NfMB9whQIAAgfwCAj7/jnRIIKeArtILCPj0K9IgAQIE5gQE/JybWwQIEEgvIODTr6hqg+YmQOCugIC/K+g+AQIEkgoI+KSL0RYBAgTuClQN+Ltu7hMgQCC9gIBPvyINEiBAYE5AwM+5uUWAQFWBjeYeCvjPwCeDWdR4J8/WzE6fr83Y82Zw2LGHHtvoMzu69fQ8FPA9BZ0hQIAAgRwCAj7HHnRB4EfAPwTWCQj4dZYqESBAIJWAgE+1Ds0QIEBgnYCAX2e5QyU9EiBQSEDAF1q2UQkQqCUg4Gvt27QECBQSWBrwhdyMSoAAgfQCAj79ijRIgACBOQEBP+fmFgECSwUUixAQ8BGqahIgQCCBgIBPsAQtECBAIEJAwEeoqplNQD8ESgoI+JJrNzQBAhUEBHyFLZuRAIGSAgJ+wdqVIECAQEYBAZ9xK3oiQIDAAgEBvwBRCQIECMwJxN4aCvgr8Ikds6961Hh9X489FTVbqxvbeV/11sfTb1+nTr0KPL239v3Xnu7+3GpGvSO9DQX8SGFnCRAgQOBZAQH/rL+vE4gUULu4gIAv/gdgfAIEzhUQ8Ofu1mQECBQXEPDF/wDujO8uAQK5BQR87v3ojgABAtMCAn6azkUCBAjkFsgb8LnddEeAAIH0AgI+/Yo0SIAAgTmBoYD/DHzm2l97K3C87tJrJ/qr1t1A4MG/btb/L7Dt7tLrp6pRsRu4/+DwyV7p4cIBF3p7beeGAr5d8BIgQIDAHgICfo896ZIAAQLDAgJ+mMyF6gLmJ7CLgIDfZVP6JECAwKCAgB8Ec5wAAQK7CAj4bJvSDwECBBYJCPhFkMoQIEAgm4CAz7YR/RAgQGBO4O2WgH8j8QsCBAicISDgz9ijKQgQIPAmIODfSPyCAIH/BPxuPwEBv9/OdEyAAIEuAQHfxeQQAQIE9hMQ8Pvt7MyOTUWAwHIBAb+cVEECBAjkEBDwOfagCwIECCwXKBLwy90UJECAQHoBAZ9+RRokQIDAnICAn3NzK5nAleCJIkkw2hU1W6ubfb7W4++7U6+tZwHfFLwECBA4UEDAH7hUIxEgQKAJCPim4CXwlIDvEggUEPCBuEoTIEDgSQEB/6S+bxMgQCBQQMAH4j5fWgcECFQWEPCVt292AgSOFhDwR6/XcAQIVBa4E/CV3cxOgACB9AICPv2KNEiAAIE5gW8AAAD//xxuBtAAAAAGSURBVAMAsWJpoU0RHk8AAAAASUVORK5CYII=" fill="none" stroke="none" strokeWidth="0.5" strokeLinecap="butt" />

                        {/* <path d="M21.36827,186.09175v-26.21743h39.51692v14.01293l-17.33694,12.20449z" fill="#000000" stroke="#72bdff" strokeWidth="0.5" strokeLinecap="butt" /> */}

                        <g className="on_off_button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                powerOnOff: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                powerOnOff: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                powerOnOff: false
                            }}
                        >
                            <path d="M21.36827,186.09175v-26.21743h39.51692v14.01293l-17.33694,12.20449z" fill="#000000" stroke="#72bdff" strokeWidth="0.5" strokeLinecap="butt" />
                            <g fill="none" stroke="#72bdff" strokeWidth="2.5">
                                <path d="M37.90628,168.12837c1.20925,0.97584 1.98274,2.47007 1.98274,4.14498c0,2.94005 -2.38338,5.32345 -5.32343,5.32345c-2.94007,0 -5.32345,-2.38338 -5.32345,-5.32345c0,-1.54676 0.65968,-2.93946 1.71302,-3.91207" strokeLinecap="butt" />
                                <path d="M34.46363,172.85177v-9.44677" strokeLinecap="round" />
                            </g>
                            <text transform="translate(26.6853,183.66108) scale(0.10407,0.10407)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">ON/OFF</tspan>
                            </text>
                        </g>

                        <path d="M44.62796,144.35214z" fill="none" stroke="#72bdff" strokeWidth="2" strokeLinecap="butt" />
                        {/* <g fill="none" stroke="#72bdff" strokeWidth="2.5">
                            <path d="M37.90628,168.12837c1.20925,0.97584 1.98274,2.47007 1.98274,4.14498c0,2.94005 -2.38338,5.32345 -5.32343,5.32345c-2.94007,0 -5.32345,-2.38338 -5.32345,-5.32345c0,-1.54676 0.65968,-2.93946 1.71302,-3.91207" strokeLinecap="butt" />
                            <path d="M34.46363,172.85177v-9.44677" strokeLinecap="round" />
                        </g>
                        <text transform="translate(26.6853,183.66108) scale(0.10407,0.10407)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">ON/OFF</tspan>
                        </text> */}
                        {/* <!-- DISPLAY (Main Window) --> */}
                        {/* <!-- <path d="M339.34911,339.10312v-91.24327h423.7256v91.24327z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" /> --> */}

                        {/* <!-- CD/DVD Slot  --> */}
                        <path d="M139.6259,193.99169v-30.58669h635.25725v30.58669z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" />

                        {/* Encoder */}
                        <g
                            stroke="#000000"
                            strokeLinecap="butt"
                        >
                            <path
                                d="M149.71986,293.48149c0,-42.14111 34.16211,-76.30324 76.30324,-76.30324c42.14111,0 76.30324,34.16211 76.30324,76.30324c0,42.14111 -34.16211,76.30324 -76.30324,76.30324c-42.14111,0 -76.30324,-34.16211 -76.30324,-76.30324z" fill={(outputValues?.powerOn) ? (outputValues?.display?.color1) : (outputValues?.display?.color2)} strokeWidth="0"
                                onMouseDown={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const center = (rect.left + (rect.width / 2));
                                    // console.log('e.clientX: ' + e.clientX);
                                    // console.log('e.currentTarget.clientLeft: ' + rect.left);
                                    mainInputs.buttons = {
                                        ...mainInputs.buttons,
                                        encoder: {
                                            ...mainInputs.buttons?.encoder,
                                            left: ((e.clientX < center)),
                                            right: ((e.clientX > center)),
                                        },
                                    }
                                }}

                                onMouseUp={() => mainInputs.buttons = {
                                    ...mainInputs.buttons,
                                    encoder: {
                                        ...mainInputs.buttons?.encoder,
                                        left: false,
                                        right: false,
                                    },
                                }}

                                onMouseLeave={() => mainInputs.buttons = {
                                    ...mainInputs.buttons,
                                    encoder: {
                                        ...mainInputs.buttons?.encoder,
                                        left: false,
                                        right: false,
                                    },
                                }}
                            />

                            <path
                                d="M162.6193,293.48149c0,-35.017 28.38688,-63.40386 63.40386,-63.40386c35.017,0 63.40386,28.38688 63.40386,63.40386c0,35.017 -28.38688,63.40386 -63.40386,63.40386c-35.017,0 -63.40386,-28.38688 -63.40386,-63.40386z" fill="url(#color-1)" strokeWidth="0.5"
                                onMouseDown={() => mainInputs.buttons = {
                                    ...mainInputs.buttons,
                                    encoder: {
                                        ...mainInputs.buttons?.encoder,
                                        button: true
                                    },
                                }}

                                onMouseUp={() => mainInputs.buttons = {
                                    ...mainInputs.buttons,
                                    encoder: {
                                        ...mainInputs.buttons?.encoder,
                                        button: false
                                    },
                                }}

                                onMouseLeave={() => mainInputs.buttons = {
                                    ...mainInputs.buttons,
                                    encoder: {
                                        ...mainInputs.buttons?.encoder,
                                        button: false
                                    },
                                }}
                            />
                        </g>

                        <g stroke="none" strokeWidth="0" strokeLinecap="butt">
                            <path d="M836.87248,341.56063c0,-9.97002 8.08231,-18.05235 18.05235,-18.05235c9.97004,0 18.05235,8.08233 18.05235,18.05235c0,9.97002 -8.08231,18.05235 -18.05235,18.05235c-9.97004,0 -18.05235,-8.08233 -18.05235,-18.05235z" fill="#aeaeae" />
                            <path d="M840.35523,341.56063c0,-8.04657 6.52303,-14.56958 14.56958,-14.56958c8.04655,0 14.56958,6.52301 14.56958,14.56958c0,8.04657 -6.52303,14.56958 -14.56958,14.56958c-8.04655,0 -14.56958,-6.52301 -14.56958,-14.56958z" fill="#6c6c6c" />
                            <path d="M843.83799,341.56063c0,-6.12308 4.96373,-11.08681 11.08681,-11.08681c6.12308,0 11.08681,4.96373 11.08681,11.08681c0,6.12308 -4.96373,11.08681 -11.08681,11.08681c-6.12308,0 -11.08681,-4.96373 -11.08681,-11.08681z" fill="#000000" />
                        </g>

                        <text transform="translate(844.04395,369.64661) scale(0.20293,0.20293)" fontSize="40" xmlSpace="preserve" fill="#000000" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">AV-IN</tspan>
                        </text>
                        <path d="M805.16474,306.83312v-78.42678l7.22347,-8.92462h65.13191l-0.10335,95.71498h-65.37253z" fill="#ffffff" stroke="none" strokeWidth="0" strokeLinecap="butt" />
                        <path d="M812.73223,304.31676v-77.39484h43.34111v77.39484z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" />
                        <text transform="translate(826.1783,312.67515) scale(0.18499,0.18499)" fontSize="40" xmlSpace="preserve" fill="#000000" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">USB</tspan>
                        </text>

                        <Display powerOn={powerOn} mainData={displayData.main || []} topLeftData={displayData.topLeft || []} otherIndication={{
                            ...displayData.otherIndication
                        }} />

                        {/* New Buttons */}


                        <path d="M314.78551,386.56898l20.90032,-15.94654h26.9943v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(1, true)}

                            onMouseUp={() => setNumberButtonState(1, false)}

                            onMouseLeave={() => setNumberButtonState(1, false)}
                        />
                        <path d="M374.80695,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(2, true)}

                            onMouseUp={() => setNumberButtonState(2, false)}

                            onMouseLeave={() => setNumberButtonState(2, false)}
                        />
                        <path d="M423.03846,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(3, true)}

                            onMouseUp={() => setNumberButtonState(3, false)}

                            onMouseLeave={() => setNumberButtonState(3, false)}
                        />
                        <path d="M471.26997,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(4, true)}

                            onMouseUp={() => setNumberButtonState(4, false)}

                            onMouseLeave={() => setNumberButtonState(4, false)}
                        />
                        <path d="M519.50149,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(5, true)}

                            onMouseUp={() => setNumberButtonState(5, false)}

                            onMouseLeave={() => setNumberButtonState(5, false)}
                        />

                        <path d="M567.73299,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(6, true)}

                            onMouseUp={() => setNumberButtonState(6, false)}

                            onMouseLeave={() => setNumberButtonState(6, false)}
                        />

                        <path d="M615.96451,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(7, true)}

                            onMouseUp={() => setNumberButtonState(7, false)}

                            onMouseLeave={() => setNumberButtonState(7, false)}
                        />

                        <path d="M712.42753,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(9, true)}

                            onMouseUp={() => setNumberButtonState(9, false)}

                            onMouseLeave={() => setNumberButtonState(9, false)}
                        />

                        <path d="M664.19602,386.56898v-15.94654h36.1047v15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(8, true)}

                            onMouseUp={() => setNumberButtonState(8, false)}

                            onMouseLeave={() => setNumberButtonState(8, false)}
                        />
                        <path d="M760.12314,386.56898v-15.94654h26.9943l20.90032,15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt"
                            onMouseDown={() => setNumberButtonState(0, true)}

                            onMouseUp={() => setNumberButtonState(0, false)}

                            onMouseLeave={() => setNumberButtonState(0, false)}
                        />
                        <text style={{ userSelect: 'none' }} transform="translate(342.28565,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">1</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(388.90636,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">2</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(437.13787,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">3</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(485.36938,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">4</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(533.60088,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">5</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(581.8324,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">6</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(630.06391,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">7</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(678.29542,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">8</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(726.52694,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">9</tspan>
                        </text>
                        <text style={{ userSelect: 'none' }} transform="translate(772.2174,383.76662) scale(0.34554,0.34554)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">0</tspan>
                        </text>

                        {/* Eject Button */}
                        <g
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                eject: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                eject: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                eject: false
                            }}
                        >
                            <path d="M784.07045,191.39962v-26.23561h59.4761l-32.54389,26.23561z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt" />
                            <g fill="#72bdff" stroke="none" strokeWidth="0" strokeLinecap="butt">
                                <path d="M794.12055,178.82562l6.66351,-7.92912l6.6635,7.92912z" />
                                <path d="M794.12055,183.02175v-2.47191h13.32702v2.47191z" />
                            </g>
                        </g>

                        {/* SRC SELECT BUTTON */}
                        <g
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                srcSelect: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                srcSelect: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                srcSelect: false
                            }}
                        >
                            <path d="M20.00585,383.15799l-0.04979,-15.94654h44.33409l19.39423,15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" />
                            <text transform="translate(23.6884,378.88225) scale(0.26274,0.26274)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">SOURCE</tspan>
                            </text>
                        </g>
                        <g
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                disp: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                disp: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                disp: false
                            }}
                        >
                            <path d="M94.81812,383.15799l-19.39423,-15.94654h56.96734l19.39423,15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" />
                            <text transform="translate(100.99737,378.88225) scale(0.26274,0.26274)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">DISP</tspan>
                            </text>
                        </g>
                        {/* <g
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                menu: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                menu: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                menu: false
                            }}
                        >
                            <path d="M144.86696,258.49572l-4.39119,30.58669h-84.01073l21.64225,-30.58669z" fill="#2b3439" stroke="#72bdff" strokeWidth="2" />
                            <path d="M139.04958,262.7642l-3.59411,22.04973h-69.20245l15.06673,-22.04973z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="2" />
                            <text transform="translate(82.89284,278.48479) scale(0.33052,0.33052)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">MENU</tspan>
                            </text>
                        </g> */}
                        {/* <g
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                back: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                back: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                back: false
                            }}
                        >
                            <path d="M78.10729,328.46726l-21.64225,-30.58669h84.01073l4.39119,30.58669z" fill="#2b3439" stroke="#72bdff" strokeWidth="2" />
                            <path d="M81.31975,324.19878l-15.06673,-22.04973h69.20245l3.59411,22.04973z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="2" />
                            <text transform="translate(85.76175,317.523) scale(0.33052,0.33052)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">BACK</tspan>
                            </text>
                        </g> */}

                        {/* <!-- Menu Button --> */}
                        <g
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                menu: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                menu: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                menu: false
                            }}
                        >
                            <path d="M83.68439,215.49771l-19.39423,15.94654h-44.33409l0.04979,-15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt" />
                            <text transform="translate(27.21783,226.96182) scale(0.26274,0.26274)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="Sans Serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">MENU</tspan>
                            </text>
                        </g>
                        {/* <!-- Back Button --> */}
                        <g
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                back: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                back: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                back: false
                            }}
                        >
                            <path d="M75.42391,231.44425l19.39423,-15.94654h56.96734l-19.39423,15.94654z" fill="#7e7e7e" stroke="#72bdff" strokeWidth="1.5" strokeLinecap="butt" />
                            <text transform="translate(100.51709,227.02132) scale(0.26274,0.26274)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="Sans Serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">BACK</tspan>
                            </text>
                        </g>

                        <path d="M32.61318,340.10761v-84.7712h84.77119v84.7712z" fill="#2b3439" stroke="#72bdff" strokeWidth="2" strokeLinecap="butt" />
                        <path d="M33.38338,339.0635l41.90378,-41.90377l41.25712,41.25712" fill="none" stroke="#72bdff" strokeWidth="2" strokeLinecap="round" />
                        <path d="M116.97138,256.16127l-41.25711,41.25712l-41.90377,-41.90377" fill="none" stroke="#72bdff" strokeWidth="2" strokeLinecap="round" />

                        {/* <!-- Next Folder Button --> */}
                        <g
                            strokeWidth="0"
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                nextFolder: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                nextFolder: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                nextFolder: false
                            }}
                        >
                            <path d="M32.61318,255.33642h84.77119l-41.93724,41.5235z" fill="#72bdff" stroke="#72bdff" />
                            <path d="M68.05183,278.86107l7.03489,-15.60482l6.859,15.60482z" fill="#ffffff" stroke="#e6e6e6" />
                        </g>
                        {/* <!-- Next Track Button --> */}
                        <g
                            strokeWidth="0"
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                nextTrack: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                nextTrack: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                nextTrack: false
                            }}
                        >
                            <path d="M116.97138,254.92343v84.77119l-41.22046,-42.24027z" fill="#45adf8" stroke="#72bdff" />
                            <path d="M102.30795,291.64505l3.6593,-6.28808l3.5678,6.28808l-3.62331,-3.60625z" fill="#ffffff" stroke="#e6e6e6" />
                            <g fill="#ffffff" stroke="#e6e6e6">
                                <path d="M89.56821,294.07748l9.11211,3.66958l-9.11211,3.57783z" />
                                <path d="M95.89324,294.07748l9.11212,3.66958l-9.11212,3.57783z" />
                                <path d="M102.21829,294.07748l9.11212,3.66958l-9.11212,3.57783z" />
                            </g>
                        </g>
                        {/* <!-- Previous Track Button --> */}
                        <g
                            strokeWidth="0"
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                prevTrack: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                prevTrack: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                prevTrack: false
                            }}
                        >
                            <path d="M33.02617,339.69462v-84.77119l41.22046,42.24028z" fill="#45adf8" stroke="#72bdff" />
                            <path d="M50.75127,285.35697l-3.65929,6.28808l-3.5678,-6.28808l3.62331,3.60624z" fill="#ffffff" stroke="#e6e6e6" />
                            <g fill="#ffffff" stroke="#e6e6e6">
                                <path d="M60.89068,301.32489l-9.11212,-3.57783l9.11212,-3.66958z" />
                                <path d="M54.56564,301.32489l-9.11212,-3.57783l9.11212,-3.66958z" />
                                <path d="M48.24059,301.32489l-9.11212,-3.57783l9.11212,-3.66958z" />
                            </g>
                        </g>
                        {/* <!-- Previous Folder Button --> */}
                        <g
                            strokeWidth="0"
                            strokeLinecap="butt"
                            className="front-panel__button"
                            onMouseDown={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                prevFolder: true
                            }}

                            onMouseUp={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                prevFolder: false
                            }}

                            onMouseLeave={() => mainInputs.buttons = {
                                ...mainInputs.buttons,
                                prevFolder: false
                            }}
                        >
                            <path d="M117.38437,339.28163h-84.77119l42.67506,-41.87264z" fill="#72bdff" stroke="#72bdff" />
                            <path d="M81.94572,317.57596l-6.859,15.60482l-7.03489,-15.60482z" fill="#ffffff" stroke="#e6e6e6" />
                        </g>
                    </g>
                </g>
            </svg>
            {/* <!--rotationCenter:432.627005:125.64786000000001--> */}
        </div>
    )
}