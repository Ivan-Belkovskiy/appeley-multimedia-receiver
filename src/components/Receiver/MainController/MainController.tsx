import { createRadioTrackRecord, getNavigationData, getTrackID3, InternetRadioStation, USBFlashInfo } from "@/app/actions";
import beeper from "@/utils/beeper";
import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from "react";
import { getCurrentExtendedMenuElement, getCurrentMenuElement } from "../FrontPanel/FrontPanel";
import { Prisma } from "@prisma/client";
import { buildNavigationFromDirectoryHandle } from "@/utils/localNavigation";
import { clamp, randomInRangeWithMax } from "@/utils/math";
import { useRadioCapture } from "@/hooks/useRadioCapture";
import { getCaptureSettings } from "@/app/captureSettings.actions";
import { requestCapturesFolder } from "@/utils/captureStorage";

export interface MainControllerInputButtons {
    powerOnOff?: boolean;
    srcSelect?: boolean;

    menu?: boolean;
    back?: boolean;

    disp?: boolean;

    eject?: boolean;

    encoder?: {
        button?: boolean;
        left?: boolean;
        right?: boolean;
    }

    num_1?: boolean;
    num_2?: boolean;
    num_3?: boolean;
    num_4?: boolean;
    num_5?: boolean;
    num_6?: boolean;
    num_7?: boolean;
    num_8?: boolean;
    num_9?: boolean;
    num_0?: boolean;

    nextFolder?: boolean;
    nextTrack?: boolean;

    prevFolder?: boolean;
    prevTrack?: boolean;

    mediaCenter?: boolean;

};

export interface MainControllerInputs {

    // myLift?: {
    //     isConnected?: boolean;

    // };
    sourceData: {
        1: {
            allowReading?: boolean;
            connectedUSBDevice?: USBFlashInfo;
        };
        2: {
            allowReading?: boolean;
            captureRequest?: boolean;
        }
    }

    isDemoAnimating?: boolean;

    buttons?: MainControllerInputButtons;
};

export enum MainControllerSources {
    "DISC",
    "USB",
    "RADIO",
    "FRONT AV-IN",
    "REAR AV-IN",
    "BT AUDIO",
    "MYLIFT"
}

export type MainControllerSource = "DISC" | "USB" | "RADIO" | "FRONT AV-IN" | "REAR AV-IN" | "BT AUDIO" | "MYLIFT";

export interface RandomPlayedTrack {
    trackNumber: number;
    folderNumber: number;
}

export interface MainControllerUSBPlaybackData {
    trackNumber: number;
    folderNumber: number;
    trackName?: {
        isID3Tag: boolean;
        data: string;
    };
    albumName?: {
        isID3Tag: boolean;
        data: string;
    };

    isTrackSelected?: boolean; // To reset display mode to default

    dataType: "audio" | "video";
    // trackName?: string;
    // albumName?: string;
    artist?: string;
    currentTime?: number;
    trackDuration?: number;

    isPlaying?: boolean;
    isPaused?: boolean;

    randomPlayInfo?: {
        on: boolean;
        playedTracks: RandomPlayedTrack[];
    };

    replayGainDb?: number;

}

export interface FolderInfo {
    number: number;
    name: string;
    path: string;
    isEmpty: boolean;
    trackList: {
        name: string;
        url: string;
        type: "audio" | "video";
    }[];
}

// export interface RadioStation {
//     id: number;
//     name: string;
//     url: string;
//     genre?: string;
// }

// export const JAZZ_RADIO_STATIONS: RadioStation[] = [
//     { id: 0, name: "101 SMOOTH JAZZ", url: "https://jking.cdnstream1.com/b22139_128mp3", genre: "Smooth Jazz" },
//     { id: 1, name: "101 MELLOW MIX", url: "https://streaming.live365.com/b48071_128mp3", genre: "Mellow Jazz" },
//     { id: 2, name: "SMOOTH JAZZ 247", url: "https://jking.cdnstream1.com/b75154_128mp3", genre: "Smooth Jazz" },
//     { id: 3, name: "SMOOTHJAZZ.COM", url: "https://smoothjazz.cdnstream1.com/2585_128.mp3", genre: "Smooth Jazz" },
//     { id: 4, name: "RADIO SWISS JAZZ", url: "http://stream.srg-ssr.ch/m/rsj/mp3_128", genre: "Jazz" },
//     { id: 5, name: "JAZZ24", url: "https://live.wostreaming.net/direct/ppm-jazz24aac256-ibc1", genre: "Jazz" },
// ];

export interface MyLiftElevatorAction {
    value: string;
    text: string;
    onSelect?: () => void;
}

export interface MyLiftElevatorActionOptionValue<T = number> {
    current: T;
    min?: number; // for number values
    max?: number;
    allowedValues?: string[]; // for string values
}

export interface MyLiftElevatorActionOption {
    value: MyLiftElevatorActionOptionValue;
    control: {
        encoder?: {
            button?: (currentValue: MyLiftElevatorActionOptionValue) => any;
            left?: (currentValue: MyLiftElevatorActionOptionValue) => any;
            right?: (currentValue: MyLiftElevatorActionOptionValue) => any;
        };
        buttons?: Record<keyof MainControllerInputButtons, () => any>;
    }
}

export interface MyLiftElevatorActionSelector {
    displayText: string;
    options: Record<string, MyLiftElevatorActionOption>,
    // control: {
    //     encoder?: "click" | "scroll-left" | "scroll-right";
    //     buttons?: (keyof MainControllerInputButtons);
    // }
}

export interface IndicationColorSetting {
    type: "static" | "animated";
    color: string;
}

export interface MenuOptionValue {
    label: string;
    onSelect: (settings: MainControllerSettings) => MainControllerSettings;

    reference?: (settings: MainControllerSettings) => any;

    displayPreview?: boolean;

    shortPropName?: string;
}

export type MenuOption = ({
    type: "block";
    label: string;

    innerOptions: MenuOption[];

    shortPropName?: string;
    // type: "block" | "property";
    // label: string;

} | {
    type: "property";
    label: string;

    valueType?: "select";

    shortPropName?: string;

    values: MenuOptionValue[];
} | {
    type: "property";
    label: string;

    valueType: "input";

    subType: "time";

    onInput: (settings: MainControllerSettings, hours: number, minutes: number) => MainControllerSettings;

    initialValue: (settings: MainControllerSettings) => [number, number];

    shortPropName?: string;

    // values: MenuOptionValue[];
} | {
    type: "button";
    label: string;

    onClick: () => any;

    // values: MenuOptionValue[];
}) & {
    displayCondition?: (outputs: MainControllerOutputs) => boolean;
};

export interface MainControllerSettings {
    demo: {
        on: boolean;
        interval: number;
    };
    indication: {
        display: IndicationColorSetting;
        buttons: IndicationColorSetting;
    };
    display: {
        playTimeFormat: "CURRENT_TIME" | "CURRENT_TIME_AND_DURATION";
        dataDisplay: {
            mode: "DEFAULT" | "DYNAMIC";
            interval: number;
        };
    };
    audio: {
        volumeControl: {
            on: boolean;
            settings: {
                maxVolume: {
                    time: [number, number];
                    volume: number;
                };
                minVolume: {
                    time: [number, number];
                    volume: number;
                };
            }
        };
        beeper: {
            on: boolean;
            volume: number;
        }
    };

    advanced: {
        autoOnOff: {
            autoON: {
                active: boolean;
                time: [number, number]; // [hours, minuts]
            };
            autoOFF: {
                active: boolean;
                time: [number, number]; // [hours, minutes]
            }
        };

        usb: {
            tagDisplay: boolean;
        };
    }

    playMode: {
        repeat?: "TRACK" | "FOLDER" | null;
        random?: "FOLDER" | "ALL" | null;
    };

    equalizer: {
        on: boolean;
        preset: "FLAT" | "DYNAMIC" | "NATURAL" | "BASS BOOST" | "VOCAL BOOST" | "CUSTOM";
        bands: {
            low: { frequency: number; gain: number; q: number };
            mid: { frequency: number; gain: number; q: number };
            high: { frequency: number; gain: number; q: number };
        };
    };
}

export interface MainControllerMenuDefinition<T = "main" | "encoderMenu"> {
    navigation: {
        _settingsBeforeUpdate?: MainControllerSettings | null;
        menuOpened?: boolean;
        menuType?: T;
        currentIdx: number;
        openedIdxArray: number[];

        timerBeforeClose: number;

        isValueSelect?: boolean;
        valueIdx?: number | null;

        _inputData?: {
            type: "time";
            timeArrayIdx: number;
            currentValue: [(number), (number)],
        }
    };
    // currentOption?: MenuOption;
    // currentIdx?: number;

    encoderMenuOptions: MenuOption[];
    options: MenuOption[];
};

export interface MainControllerExtendedMenu<T extends string, AdditionalOptionProps extends Record<string, any> = {}> {
    navigation: {
        _settingsBeforeUpdate?: MainControllerSettings | null;
        menuOpened?: boolean;
        menuType?: T;
        currentIdx: number;
        openedIdxArray: number[];

        timerBeforeClose: number;

        isValueSelect?: boolean;
        valueIdx?: number | null;

        _inputData?: {
            type: "time";
            timeArrayIdx: number;
            currentValue: [(number), (number)],
        }
    };
    // currentOption?: MenuOption;
    // currentIdx?: number;

    options: Record<T, (MenuOption & AdditionalOptionProps)[]>;

    // encoderMenuOptions: MenuOption[]
    // options: MenuOption[];
};

export interface MainControllerOutputs {
    powerOn?: boolean;
    currentSource?: MainControllerSources;

    mainVolume: number;

    menu: MainControllerMenuDefinition;

    settings: MainControllerSettings;

    resetDemo?: boolean; // To reset demo

    discState?: "load" | "eject" | null;

    sourceData: {
        1: {
            // USB
            isReading?: boolean;
            isReadingID3?: boolean;
            error?: string;
            playbackData?: MainControllerUSBPlaybackData;
            // usbDevice?: USBFlashInfo;
            navigationData?: FolderInfo[];

            normalizationGain?: number | null;



            dataToLoad?: {
                trackNumber: number;
                folderNumber: number;
            };

            menu?: {
                menuType: "settings" | "navigation";
                mainIndex: number;

                subCategory: string | null;
                subIndex: number | null;

                error?: string;
            };

            timeMove?: {
                on: boolean;
                direction: "left" | "right";
                speed: number;
                interval: number;
                timer: number;
                isMoving: boolean;
            };



            // isMenuOpened?: boolean;
            // isNavigationOpened?: boolean;
        };
        2: {
            // FM / Radio

            navigation?: {
                stationIdx: number;
            };

            isPaused?: boolean;
            currentStationIndex?: number;
            currentStationId?: number;
            isBuffering?: boolean;
            error?: string;

            currentTitle?: string;
            currentArtist?: string;
            streamTitle?: string;

            recognition?: {
                phase: 'WAITING' | 'CAPTURING' | 'DOWNLOADING' | 'DETECTING' | 'DONE' | 'ERROR';
                downloadTo?: "local" | "vercel_blob" | "electron" | "all";
                startedAt?: number;
                captureEndsAt?: number;
                artist?: string;
                title?: string;
                album?: string;
                error?: string;
                source?: 'acrcloud' | 'audd' | 'manual';
            };
        };
        6: {
            // MyLift
            isConnecting?: boolean;
            isConnected?: boolean;
            connectionInfo?: {
                ip?: string;
                port?: string;
            },
            connectionError?: string;
            data?: any;

            selectedElevatorData?: any;

            ui?: {
                elevatorCategorySelection?: boolean;
                elevatorListSelection?: {
                    currentLift?: number;
                };
                selectedElevator?: {
                    liftId: string;
                    liftNumber: number;
                    floorNumber?: number;
                };
                elevatorActionSelection?: {
                    mainIdx: number;
                    items: MyLiftElevatorAction[];

                    currentAction?: string;
                    selection: Record<string, MyLiftElevatorActionSelector>;
                };

                elevatorCoursebotNavigation?: {

                    navigationTypeSelection?: {
                        idx: number;
                        types: string[];
                    } | null;

                    floorSelection?: boolean;
                    floorIdx: number;

                    floorSlotView?: boolean;
                    floorSlotIdx?: number;

                    slotDataView?: boolean;
                    slotDataIdx?: number;
                }

                error?: string;

            };
        }
    };

    autoOnOffMenu: MainControllerExtendedMenu<'autoON' | 'autoOFF'>;

    autoOnOff?: {
        ON?: {
            activatedAt: Date;
            activated: boolean;
            timer: number;
            buttonIndication?: boolean;

            isInterrupted?: boolean;
        };
        OFF?: {
            activatedAt: Date;
            activated: boolean;
            timer: number;
            encoderIndication?: boolean;

            isInterrupted?: boolean;
        }
    }

    // currentSource?: MainControllerSource;
    indicationColor?: {
        display?: string;
        buttons?: string;
        // mainData?: string;
        // secondaryData?: string;
    };

    resetAnimationsTimer?: {
        animTimer?: boolean;
    };

    appeleyMediaCenter?: {
        isOpened: true;
        isModalOpened?: boolean;
        // isLoading?: boolean;
    };

    appeleyMediaCenterMenu: MainControllerExtendedMenu<'selection', {
        scrollText?: boolean;

    }>;
}


export default function MainController({
    inputsRef,
    outputsRef,

    videoOutputRef, // В дальнейшем переместить в outputsRef
    setVideoPowerOn,

    internetRadioStations
}: {
    inputsRef: RefObject<MainControllerInputs>;
    outputsRef: RefObject<MainControllerOutputs>;

    videoOutputRef: RefObject<HTMLVideoElement | null>;
    setVideoPowerOn: Dispatch<SetStateAction<boolean | undefined>>;

    internetRadioStations: InternetRadioStation[];
}) {

    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);


    let audioContext: AudioContext | null = null;
    let lowFilter: BiquadFilterNode | null = null;
    let midFilter: BiquadFilterNode | null = null;
    let highFilter: BiquadFilterNode | null = null;
    let masterGain: GainNode | null = null;
    let currentSource: MediaElementAudioSourceNode | null = null;

    const ensureAudioGraph = () => {
        if (audioContext) return;

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        lowFilter = audioContext.createBiquadFilter();
        lowFilter.type = 'peaking';

        midFilter = audioContext.createBiquadFilter();
        midFilter.type = 'peaking';

        highFilter = audioContext.createBiquadFilter();
        highFilter.type = 'peaking';

        masterGain = audioContext.createGain();
        masterGain.gain.value = 1.0;

        lowFilter.connect(midFilter);
        midFilter.connect(highFilter);
        highFilter.connect(masterGain);
        masterGain.connect(audioContext.destination);
    };

    const applyEQSettings = () => {
        if (!lowFilter || !midFilter || !highFilter) return;

        const eq = outputsRef.current.settings.equalizer;
        const bands = eq.bands;

        const lowGain = eq.on ? bands.low.gain : 0;
        const midGain = eq.on ? bands.mid.gain : 0;
        const highGain = eq.on ? bands.high.gain : 0;

        lowFilter.frequency.value = bands.low.frequency;
        lowFilter.Q.value = bands.low.q;
        lowFilter.gain.value = lowGain;

        midFilter.frequency.value = bands.mid.frequency;
        midFilter.Q.value = bands.mid.q;
        midFilter.gain.value = midGain;

        highFilter.frequency.value = bands.high.frequency;
        highFilter.Q.value = bands.high.q;
        highFilter.gain.value = highGain;
    };

    // useEffect(() => {
    //     alert(123)
    // if (inputsRef.current.buttons) {

    //     if (inputsRef.current.buttons.powerOnOff) console.info('Power On Button!')

    // }
    // }, [inputsRef.current]);
    const metadataSourceRef = useRef<EventSource | null>(null);

    const { capture, cancelCapture } = useRadioCapture();

    useEffect(() => {
        let frameId: number;

        let powerBtnTimer = 0;


        let srcBtnTimer = 0;

        let clickedNumButton: string | null = null;

        let clickedEncoderBtn: string | null = null;

        let clickedOtherButton: string | null = null;

        let displayUpdateTimer = 0;

        let _radioStreamText = false;
        let _radioStationId: number | null = null;

        const saveRadioTrackToDb = async (id: number, text: string) => {
            await createRadioTrackRecord(id, text);
        }

        let metadataIntervalId: ReturnType<typeof setInterval> | null = null;
        let metadataAbortController: AbortController | null = null;

        const fetchRadioMetadata = async (streamUrl: string) => {
            metadataAbortController?.abort();
            const controller = new AbortController();
            metadataAbortController = controller;

            try {
                const res = await fetch(
                    `/api/radio-metadata?url=${encodeURIComponent(streamUrl)}`,
                    { signal: controller.signal }
                );

                if (res.status === 204) return;

                if (!res.ok) {
                    console.warn('Metadata fetch failed:', res.status);
                    return;
                }

                const data = await res.json();
                if (!data?.raw) return;

                outputsRef.current.sourceData[2].currentTitle = data.title;
                outputsRef.current.sourceData[2].currentArtist = data.artist;
                outputsRef.current.sourceData[2].streamTitle = data.raw;

                if (
                    _radioStreamText !== data.raw ||
                    _radioStationId !== outputsRef.current.sourceData[2].currentStationId
                ) {
                    if (outputsRef.current.sourceData[2].currentStationId) {
                        saveRadioTrackToDb(
                            outputsRef.current.sourceData[2].currentStationId,
                            data.raw
                        );
                    }
                    _radioStreamText = data.raw;
                    _radioStationId = outputsRef.current.sourceData[2].currentStationId || null;
                }
            } catch (err: any) {
                if (err?.name !== 'AbortError') {
                    console.warn('Metadata error:', err);
                }
            }
        };

        const startMetadataPolling = (streamUrl: string) => {
            stopMetadataPolling();

            fetchRadioMetadata(streamUrl);

            metadataIntervalId = setInterval(() => {
                fetchRadioMetadata(streamUrl);
            }, 30000);
        };

        const stopMetadataPolling = () => {
            if (metadataIntervalId) {
                clearInterval(metadataIntervalId);
                metadataIntervalId = null;
            }
            metadataAbortController?.abort();
            metadataAbortController = null;
        };

        // const startMetadataPolling = (streamUrl: string) => {
        //     if (metadataSourceRef.current) {
        //         metadataSourceRef.current.close();
        //     }

        //     let reconnectAttempts = 0;
        //     const MAX_RECONNECT_DELAY = 10_000;

        //     const connect = () => {
        //         const eventSource = new EventSource(
        //             `/api/radio-metadata?url=${encodeURIComponent(streamUrl)}`
        //         );

        //         eventSource.onopen = () => {
        //             console.log('📡 Metadata stream opened');
        //             reconnectAttempts = 0;
        //         };

        //         eventSource.onmessage = (event) => {
        //             try {
        //                 const data = JSON.parse(event.data);
        //                 if (data.error) {
        //                     console.error('Metadata error:', data.error);
        //                     return;
        //                 }
        //                 if (data.title || data.artist) {
        //                     outputsRef.current.sourceData[2].currentTitle = data.title;
        //                     outputsRef.current.sourceData[2].currentArtist = data.artist;
        //                     outputsRef.current.sourceData[2].streamTitle = data.raw;

        //                     if (
        //                         _radioStreamText !== data.raw ||
        //                         _radioStationId !== outputsRef.current.sourceData[2].currentStationId
        //                     ) {
        //                         if (outputsRef.current.sourceData[2].currentStationId) {
        //                             saveRadioTrackToDb(
        //                                 outputsRef.current.sourceData[2].currentStationId,
        //                                 data.raw
        //                             );
        //                         }
        //                         _radioStreamText = data.raw;
        //                         _radioStationId = outputsRef.current.sourceData[2].currentStationId || null;
        //                     }
        //                 }
        //             } catch (e) {
        //                 console.error('Failed to parse metadata:', e);
        //             }
        //         };

        //         eventSource.onerror = (err) => {
        //             console.warn('🔄 Metadata stream error, reconnecting...', err);
        //             eventSource.close();

        //             reconnectAttempts++;
        //             const delay = Math.min(1000 * 2 ** (reconnectAttempts - 1), MAX_RECONNECT_DELAY);

        //             console.log(`⏳ Reconnect in ${delay}ms (attempt ${reconnectAttempts})`);
        //             setTimeout(connect, delay);
        //         };

        //         metadataSourceRef.current = eventSource;
        //     };

        //     connect();
        // };

        // const stopMetadataPolling = () => {
        //     if (metadataSourceRef.current) {
        //         metadataSourceRef.current.close();
        //         metadataSourceRef.current = null;
        //     }
        // };

        const getMyLiftData = (ip: string, port: string) => new Promise(async (resolve, reject) => {
            try {
                const res = await fetch(`http://${ip}:${port}/api/elevators`, {
                    // headers: {
                    //     'Access-Control-Allow-Origin': 'true',
                    // }
                });
                const data = await res.json();

                if (data.success) {
                    resolve(data);
                } else reject();
            } catch (error) {
                reject(error);
            }
        });

        const getCurrentMyLiftElevator = (elevatorId?: string, ip?: string, port?: string) => new Promise(async (resolve, reject) => {
            try {
                if (!ip || !port) throw new Error('Connection Data Not Provided!');
                if (!elevatorId) throw new Error('Elevator ID not provided!');
                const res = await fetch(`http://${ip}:${port}/api/elevators/${elevatorId}`);
                const data = await res.json();

                if (data.success && data.lift) {
                    resolve(data.lift);
                }
            } catch (error) {
                reject(error);
            }
        });

        // const getNavigation = () => new Promise(async (resolve, reject) => {
        //     try {
        //         const usbId = inputsRef.current.sourceData[1].connectedUSBDevice?.id;
        //         if (!usbId) throw new Error("No USB device connected!");
        //         const data = await getNavigationData(usbId);
        //         resolve(data.data);
        //     } catch (error) {
        //         reject(error);
        //     }
        // });

        const getNavigation = () => new Promise(async (resolve, reject) => {
            try {
                const connected = inputsRef.current.sourceData[1].connectedUSBDevice;
                if (!connected) throw new Error('No USB device connected!');

                if (connected.kind === 'local' && connected.directoryHandle) {
                    const data = await buildNavigationFromDirectoryHandle(connected.directoryHandle);
                    resolve(data);
                } else if (connected.id) {
                    const res = await getNavigationData(connected.id);
                    resolve(res.data);
                } else {
                    throw new Error('Invalid USB device');
                }
            } catch (error) {
                reject(error);
            }
        });

        const getCurrentID3 = () => new Promise(async (resolve, reject) => {
            try {
                if (!outputsRef.current.sourceData[1]) throw new Error('Source data not provided!');

                const sourceData = outputsRef.current.sourceData[1];

                if (!sourceData.playbackData || !sourceData.navigationData) {
                    throw new Error('Playback or navigation data not provided!');
                }

                const currentFolder = sourceData.navigationData.find(
                    v => v.number === sourceData.playbackData!.folderNumber
                );
                const track = currentFolder?.trackList[sourceData.playbackData.trackNumber];
                if (!track) throw new Error('Track not found!');

                let id3: any = null;

                if (track.url?.startsWith('blob:')) {
                    const { readID3FromBlobUrl } = await import('@/utils/id3Client');
                    try {
                        id3 = await readID3FromBlobUrl(track.url);
                    } catch (err) {
                        console.warn('Локальный ID3 не прочитан:', err);
                        id3 = null;
                    }
                } else {
                    const res = await getTrackID3(track.url);
                    id3 = res.id3;
                }

                sourceData.playbackData.trackName = {
                    isID3Tag: !!id3?.common?.title,
                    data: id3?.common?.title || track.name,
                };
                sourceData.playbackData.albumName = {
                    isID3Tag: !!id3?.common?.album,
                    data: id3?.common?.album || currentFolder!.name,
                };
                sourceData.playbackData.artist = id3?.common?.artist;

                sourceData.playbackData.isTrackSelected = false;

                if (id3?.format?.duration) {
                    sourceData.playbackData.trackDuration = id3.format.duration;
                }

                resolve(true);
            } catch (error) {
                console.warn('getCurrentID3 error:', error);
                reject(error);
            }
        });

        const generateRandomTrackFolderNumber = (
            currentFolder?: number,
        ): { folderNumber: number; trackNumber: number } | undefined => {
            const usbData = outputsRef.current.sourceData[1];
            const randomMode = outputsRef.current.settings.playMode.random;

            if (!randomMode || !usbData.navigationData || !usbData.playbackData) {
                return undefined;
            }

            if (!usbData.playbackData.randomPlayInfo?.on) {
                usbData.playbackData.randomPlayInfo = {
                    on: true,
                    playedTracks: [],
                };
            }

            const playedTracks = usbData.playbackData.randomPlayInfo.playedTracks;
            const nav = usbData.navigationData;

            const isPlayed = (f: number, t: number) =>
                playedTracks.some(p => p.folderNumber === f && p.trackNumber === t);

            if (randomMode === 'FOLDER') {
                if (typeof currentFolder !== 'number') return undefined;

                const folder = nav.find(f => f.number === currentFolder);
                if (!folder || folder.isEmpty) return undefined;

                const remaining: number[] = [];
                for (let i = 0; i < folder.trackList.length; i++) {
                    if (!isPlayed(currentFolder, i)) remaining.push(i);
                }

                if (remaining.length === 0) return undefined;

                const trackNumber = remaining[randomInRangeWithMax(0, remaining.length - 1)];
                return { folderNumber: currentFolder, trackNumber };
            }

            const remaining: RandomPlayedTrack[] = [];
            for (const folder of nav) {
                if (folder.isEmpty) continue;
                for (let i = 0; i < folder.trackList.length; i++) {
                    if (!isPlayed(folder.number, i)) {
                        remaining.push({ folderNumber: folder.number, trackNumber: i });
                    }
                }
            }

            if (remaining.length === 0) {
                usbData.playbackData.randomPlayInfo.playedTracks = [];
                return generateRandomTrackFolderNumber(currentFolder);
            }

            return remaining[randomInRangeWithMax(0, remaining.length - 1)];
        };

        const tryReadTrack = (folder: number, track: number, folderOffset?: "next" | "prev") => new Promise(async (resolve, reject) => {
            try {
                const navigationData = outputsRef.current.sourceData[1].navigationData;
                if (!navigationData) throw new Error('Navigation data not provided!');

                // if (outputsRef.current.sourceData[1].playbackData) outputsRef.current.sourceData[1].playbackData = {
                //     ...outputsRef.current.sourceData[1].playbackData,
                //     trackName: undefined,
                //     albumName: undefined,
                //     isTrackSelected: true,
                // };

                // alert(folderOffset)
                // const currentFolder = navigationData.find((val, idx) => val.number);
                // if (!currentFolder) throw new Error('Folder not found!');

                let current: FolderInfo | undefined = navigationData[folder];

                // let trackNumber = track;

                // if (trackNumber < 0) trackNumber = 0;
                // if (trackNumber > current.trackList.length - 1) {
                //     trackNumber = 0;
                //     folderOffset = 'next';
                // }
                // let available: FolderInfo = current;

                // if (current?.isEmpty) {
                const available = (folderOffset === 'prev') ? navigationData.findLast(v => {
                    if (folderOffset) {
                        if (folderOffset === 'prev') return (
                            v.number < folder && !v.isEmpty
                        ); else return (
                            v.number > folder && !v.isEmpty
                        )
                    } else return (
                        v.number === folder && !v.isEmpty
                    )
                }) : navigationData.find(v => {
                    if (folderOffset) {
                        /*if (folderOffset === 'prev') return (
                            v.number < folder && !v.isEmpty
                        ); else*/ return (
                            v.number > folder && !v.isEmpty
                        )
                    } else return (
                        v.number === folder && !v.isEmpty
                    )
                });

                if (!available) throw new Error('Available-to-play folder not found');

                current = available;

                // alert(available.name);
                // }

                // alert(123)

                let trackNumber = track;

                if (trackNumber < 0) trackNumber = 0;
                if (trackNumber > current.trackList.length - 1) {
                    trackNumber = (current.trackList.length - 1);
                    return tryReadTrack(folder, 0, 'next');
                }

                if (outputsRef.current.sourceData[1].playbackData) outputsRef.current.sourceData[1].playbackData = {
                    ...outputsRef.current.sourceData[1].playbackData,
                    trackNumber,
                    folderNumber: current.number,
                    trackName: undefined,
                    albumName: undefined,
                    isTrackSelected: true,
                };

                // if (trackNumber > current.trackCount - 1) trackNumber = (current.trackCount - 1);

                const trackData = current.trackList[trackNumber];

                let trackUrl = trackData.url;
                if (!trackUrl && (trackData as any).fileHandle) {
                    const fileHandle: FileSystemFileHandle = (trackData as any).fileHandle;

                    const permission = await (fileHandle as any).queryPermission({ mode: 'read' });
                    if (permission !== 'granted') {
                        const requested = await (fileHandle as any).requestPermission({ mode: 'read' });
                        if (requested !== 'granted') {
                            throw new Error('PERMISSION DENIED');
                        }
                    }

                    const file = await fileHandle.getFile();
                    trackUrl = URL.createObjectURL(file);

                    (trackData as any).url = trackUrl;
                }

                if (!trackUrl) throw new Error('Track URL is empty');


                if (trackData.type === 'audio') {
                    if (audioPlayerRef.current) {
                        audioPlayerRef.current.pause();
                        audioPlayerRef.current.removeAttribute('src');
                        audioPlayerRef.current.load();
                    }
                    if (videoOutputRef.current) videoOutputRef.current.src = '';

                    const audio = new Audio();
                    audio.preload = 'metadata';
                    audio.crossOrigin = 'anonymous';
                    audio.src = trackUrl;

                    ensureAudioGraph();
                    if (audioContext!.state === 'suspended') {
                        await audioContext!.resume();
                    }

                    if (currentSource) {
                        try { currentSource.disconnect(); } catch { }
                        currentSource = null;
                    }

                    currentSource = audioContext!.createMediaElementSource(audio);
                    currentSource.connect(lowFilter!);

                    audio.volume = 1.0;

                    applyEQSettings();

                    audioPlayerRef.current = audio;

                    const d = outputsRef.current.sourceData;



                    if (d[1].playbackData?.replayGainDb !== undefined && d[1].playbackData.replayGainDb !== null) {
                        const gain = Math.pow(10, d[1].playbackData.replayGainDb / 20);
                        d[1].normalizationGain = gain;
                    }

                    const onCanPlay = () => {
                        console.log('AUDIO LOADED:', trackUrl);
                        audio.removeEventListener('canplay', onCanPlay);
                        audio.play().then(() => resolve(true)).catch(reject);

                        const prevRandom = outputsRef.current.sourceData[1].playbackData?.randomPlayInfo;

                        outputsRef.current.sourceData[1].playbackData = {
                            folderNumber: available.number,
                            trackNumber,
                            dataType: "audio",
                            trackDuration: audio.duration,
                            randomPlayInfo: prevRandom,
                        };

                        d[1].isReadingID3 = true;
                        getCurrentID3()
                            .then(() => {
                                d[1].isReadingID3 = false;
                            })
                            .catch((err) => {
                                console.warn('ID3 read failed:', err);
                                d[1].isReadingID3 = false;
                            });

                        if (
                            outputsRef.current.settings.playMode.random &&
                            outputsRef.current.sourceData[1].playbackData.randomPlayInfo?.on
                        ) {
                            const played = outputsRef.current.sourceData[1].playbackData.randomPlayInfo.playedTracks;
                            const already = played.some(
                                p => p.folderNumber === available.number && p.trackNumber === trackNumber
                            );
                            if (!already) {
                                played.push({ folderNumber: available.number, trackNumber });
                            }
                        }
                    };

                    const onTimeUpdate = () => {
                        if (outputsRef.current.sourceData[1].playbackData) {
                            outputsRef.current.sourceData[1].playbackData.currentTime = audio.currentTime;
                        }
                    };

                    const onEnded = () => {
                        audio.removeEventListener('timeupdate', onTimeUpdate);
                        audio.removeEventListener('ended', onEnded);
                        if (outputsRef.current.settings.playMode.repeat === 'TRACK') {
                            // Repeat current track
                            tryReadTrack((folder), trackNumber);
                            // audio.currentTime = 0;
                        } else if (outputsRef.current.settings.playMode.repeat === 'FOLDER') {
                            // Repeat current folder, if it ended
                            if (trackNumber === current.trackList.length - 1) {
                                tryReadTrack((folder), 0);
                            } else selectTrack('next');
                        } else {
                            selectTrack('next');
                        }
                    };

                    audio.addEventListener('canplay', onCanPlay, { once: true });
                    audio.addEventListener('timeupdate', onTimeUpdate);
                    audio.addEventListener('ended', onEnded, { once: true });

                    audio.play().catch((err) => {
                        console.warn('play() deferred:', err.name, err.message);
                    });
                } else {

                    if (videoOutputRef.current) {

                        if (audioPlayerRef.current) audioPlayerRef.current.src = '';
                        videoOutputRef.current.src = trackUrl;
                        videoOutputRef.current.play();
                        setVideoPowerOn(true);

                        if (outputsRef.current.sourceData[1].playbackData) {
                            outputsRef.current.sourceData[1].playbackData.isPlaying = true;
                        }

                        videoOutputRef.current.volume = (outputsRef.current.mainVolume / 100);

                        const canplayHandler = () => {
                            console.log('AUDIO LOADED! URL: ', videoOutputRef.current?.src);
                            videoOutputRef.current?.play();
                            resolve(true);

                            if (outputsRef.current.sourceData[1].playbackData) {
                                outputsRef.current.sourceData[1].playbackData.isPlaying = true;
                            }

                            outputsRef.current.sourceData[1].playbackData = {
                                folderNumber: available.number,
                                trackNumber,
                                dataType: "video",
                            };
                        };

                        videoOutputRef.current.addEventListener('canplay', canplayHandler);
                        videoOutputRef.current.addEventListener('timeupdate', () => {
                            if (outputsRef.current.sourceData[1].playbackData) {
                                outputsRef.current.sourceData[1].playbackData.currentTime = (
                                    videoOutputRef.current?.currentTime || undefined
                                )
                            }
                        });
                        videoOutputRef.current.addEventListener('ended', () => {
                            selectTrack('next');
                        });

                    }
                }



            } catch (error) {
                // beeper.beep(3);
                reject(error);
            }
        });

        const playRadio = (stationIdx: number) => {

            const station = internetRadioStations[stationIdx];
            if (!station) return;

            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.removeAttribute('src');
                audioPlayerRef.current.load();
            }
            if (videoOutputRef.current) {
                videoOutputRef.current.src = '';
            }

            const audio = new Audio();
            audio.preload = 'none';
            audio.volume = outputsRef.current.mainVolume / 100;
            audio.crossOrigin = 'anonymous';
            audio.src = station.url;

            audioPlayerRef.current = audio;

            ensureAudioGraph();
            if (audioContext!.state === 'suspended') {
                audioContext!.resume().catch(() => { });
            }

            if (currentSource) {
                try { currentSource.disconnect(); } catch { }
                currentSource = null;
            }

            currentSource = audioContext!.createMediaElementSource(audio);
            currentSource.connect(lowFilter!);

            applyEQSettings();

            audioPlayerRef.current = audio;

            startMetadataPolling(station.url);

            audio.addEventListener('waiting', () => {
                outputsRef.current.sourceData[2].isBuffering = true;
            }, { once: true });

            audio.addEventListener('playing', () => {
                outputsRef.current.sourceData[2].isBuffering = false;
                outputsRef.current.sourceData[2].error = undefined;
            }, { once: true });

            audio.addEventListener('error', (e) => {
                console.error('Radio error:', e);
                outputsRef.current.sourceData[2].error = 'STREAM ERROR';
                outputsRef.current.sourceData[2].isBuffering = false;
            }, { once: true });

            audio.play().catch((err) => {
                console.error(`Не удалось запустить "${station.name}":`, err.name, err.message);
                outputsRef.current.sourceData[2].error = 'PLAY ERROR';
                outputsRef.current.sourceData[2].isBuffering = false;
            });

            outputsRef.current.sourceData[2].currentStationIndex = stationIdx;
            outputsRef.current.sourceData[2].currentStationId = station.id;
            outputsRef.current.sourceData[2].isBuffering = true;
            outputsRef.current.sourceData[2].isPaused = false;

            beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);

        };

        const selectFolder = (direction: "next" | "prev") => {
            if (typeof outputsRef.current.sourceData[1].playbackData?.folderNumber === 'number') {
                const folder = outputsRef.current.sourceData[1].playbackData.folderNumber;

                const pb = outputsRef.current.sourceData[1].playbackData;
                if (
                    outputsRef.current.settings.playMode.random === 'FOLDER' &&
                    pb?.randomPlayInfo
                ) {
                    pb.randomPlayInfo.playedTracks = [];
                }

                if (direction === 'next') {
                    tryReadTrack(folder, 0, "next");
                } else {
                    tryReadTrack(folder, 0, "prev");
                }
            }
        };

        const selectTrack = (direction: "next" | "prev") => {
            if (
                typeof outputsRef.current.sourceData[1].playbackData?.trackNumber === 'number' &&
                typeof outputsRef.current.sourceData[1].playbackData.folderNumber === 'number'
            ) {
                const folder = outputsRef.current.sourceData[1].playbackData.folderNumber;
                const track = outputsRef.current.sourceData[1].playbackData.trackNumber;

                const randomMode = outputsRef.current.settings.playMode.random;

                // if (randomMode) {
                if (direction === 'next' && randomMode) {
                    const next = generateRandomTrackFolderNumber(folder);

                    if (next) {
                        tryReadTrack(next.folderNumber, next.trackNumber);
                        return;
                    }

                    if (randomMode === 'FOLDER') {
                        if (outputsRef.current.sourceData[1].playbackData?.randomPlayInfo) {
                            outputsRef.current.sourceData[1].playbackData.randomPlayInfo.playedTracks = [];
                        }
                        selectFolder('next');
                        return;
                    } else {
                        const retry = generateRandomTrackFolderNumber(folder);
                        if (retry) tryReadTrack(retry.folderNumber, retry.trackNumber);
                        return;
                    }
                } else if (direction === 'prev' && randomMode) {
                    const played = outputsRef.current.sourceData[1].playbackData?.randomPlayInfo?.playedTracks;

                    if (played && played.length > 1) {
                        played.pop();

                        const prevData = played[played.length - 1];

                        if (prevData) {
                            tryReadTrack(prevData.folderNumber, prevData.trackNumber);
                        }
                    } else {
                        return beeper.tripleBeep(
                            outputsRef.current.settings.audio.beeper.volume,
                            outputsRef.current.settings.audio.beeper.on
                        );
                    }
                } else if (direction === 'next') {
                    tryReadTrack(folder, track + 1);
                } else {
                    tryReadTrack(folder, track - 1);
                }
                // }
            }
        };

        const resetDemo = () => {
            outputsRef.current.resetDemo = true;
        }

        let clickedButton: keyof MainControllerInputButtons | null = null;

        let buttonClickTimer = 0;

        let autoOnOffTimer = 0;

        let volumeAdjustTimer = 0;
        const VOLUME_STEP = 1;

        const calculateTargetVolume = (): number | null => {
            const volumeControl = outputsRef.current.settings.audio.volumeControl;
            if (!volumeControl.on) return null;

            const { maxVolume, minVolume } = volumeControl.settings;
            const maxMinutes = maxVolume.time[0] * 60 + maxVolume.time[1];
            const minMinutes = minVolume.time[0] * 60 + minVolume.time[1];

            if (maxMinutes === minMinutes && maxVolume.volume === minVolume.volume) {
                return null;
            }

            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

            const TOTAL_DAY = 24 * 60;

            let descent = minMinutes - maxMinutes;
            if (descent <= 0) descent += TOTAL_DAY;

            let elapsed = nowMinutes - maxMinutes;
            if (elapsed < 0) elapsed += TOTAL_DAY;

            let progress: number;
            const ascent = TOTAL_DAY - descent;

            if (elapsed <= descent) {
                progress = descent > 0 ? elapsed / descent : 1;
            } else if (ascent > 0) {
                progress = 1 - (elapsed - descent) / ascent;
            } else {
                progress = 1;
            }

            progress = Math.max(0, Math.min(1, progress));

            const target =
                maxVolume.volume + (minVolume.volume - maxVolume.volume) * progress;

            return Math.round(target);
        };

        const tryCaptureRadio = async () => {
            if (outputsRef.current.sourceData[2].currentStationId) {
                const currentId = outputsRef.current.sourceData[2].currentStationId;
                const station = internetRadioStations.find(st => st.id === currentId);

                const settingsGetResult = await getCaptureSettings();

                if (settingsGetResult.success && settingsGetResult.data) {
                    const captureSettings = settingsGetResult.data;
                    if (station) {

                        outputsRef.current.sourceData[2].recognition = {
                            phase: "WAITING",
                            downloadTo: captureSettings.storageType
                        }

                        outputsRef.current.resetDemo = true;

                        if (captureSettings.storageType === 'local') {
                            await requestCapturesFolder();
                        }

                        outputsRef.current.sourceData[2].recognition = {
                            ...outputsRef.current.sourceData[2].recognition,
                            phase: "CAPTURING",
                            startedAt: Date.now()
                        }

                        try {
                            const captureResult = await capture(station.url, captureSettings.captureDurationMs, {
                                filename: `AP-L037_Receiver_Radio-Capture_${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`,
                                onProgress: (progress) => {

                                },
                                onStartDownloading: () => {
                                    outputsRef.current.sourceData[2].recognition = {
                                        ...outputsRef.current.sourceData[2].recognition,
                                        phase: "DOWNLOADING"
                                    }
                                },
                                saveLocally: (captureSettings.storageType === 'local'),
                            });

                            outputsRef.current.resetDemo = true;
                            outputsRef.current.sourceData[2].recognition = {
                                ...outputsRef.current.sourceData[2].recognition,
                                phase: "DONE",

                                captureEndsAt: Date.now()
                            }
                        } catch (error) {
                            beeper.tripleBeep(
                                outputsRef.current.settings.audio.beeper.volume,
                                outputsRef.current.settings.audio.beeper.on,
                            )
                            outputsRef.current.sourceData[2].recognition = {
                                ...outputsRef.current.sourceData[2].recognition,
                                phase: "ERROR",
                                error: (error as any)?.message || "CAPTURE ERROR",
                                captureEndsAt: Date.now()
                            }
                        }
                    }
                }

            }
        }

        const processVolumeControl = () => {
            const target = calculateTargetVolume();

            if (target === null) {
                volumeAdjustTimer = 0;
                return;
            }

            const current = outputsRef.current.mainVolume;

            if (current === target) {
                volumeAdjustTimer = 0;
                return;
            }

            const diff = Math.abs(target - current);
            let interval: number;
            if (diff > 20) interval = 30;
            else if (diff > 10) interval = 60;
            else if (diff > 3) interval = 90;
            else interval = 120;

            volumeAdjustTimer++;
            if (volumeAdjustTimer < interval) return;
            volumeAdjustTimer = 0;

            const step = Math.sign(target - current) * Math.min(VOLUME_STEP, diff);
            outputsRef.current.mainVolume = Math.max(0, Math.min(100, current + step));
        };

        const processAutoOnOff = () => {
            const settings = outputsRef.current.settings;

            if (outputsRef.current.autoOnOffMenu.navigation.menuOpened) {
                processEncoderInput('scroll-left', () => {
                    if (outputsRef.current.autoOnOffMenu.navigation.menuOpened) {
                        // MENU NAVIGATION

                        const navigation = outputsRef.current.autoOnOffMenu.navigation;

                        navigation.timerBeforeClose = (30 * 60);

                        if (navigation.isValueSelect) {

                            const currentElement = getCurrentExtendedMenuElement(outputsRef.current.autoOnOffMenu);

                            if (currentElement?.type === 'property' && currentElement.valueType === 'input') {

                                const inputData = navigation._inputData;

                                if (inputData?.type === 'time') {

                                    const val = inputData.currentValue;

                                    if (val[inputData.timeArrayIdx] > 0) {
                                        val[inputData.timeArrayIdx]--;
                                    }

                                    outputsRef.current.resetAnimationsTimer = {
                                        animTimer: true,
                                    };

                                }

                            } else if (currentElement?.type === 'property' && typeof navigation.valueIdx === 'number') {
                                if (navigation.valueIdx > 0) {
                                    navigation.valueIdx--;
                                }
                            }

                            // const currentElement = getCurrentMenuElement(outputsRef.current.menu);
                            // if (currentElement?.type === 'property') {
                            //     const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                            //     outputsRef.current.settings = value;
                            // }
                        } else {
                            if (navigation.currentIdx > 0) {
                                navigation.currentIdx--;
                            }
                        }
                    }

                });

                processEncoderInput('click', () => {
                    if (outputsRef.current.autoOnOffMenu.navigation.menuOpened) {
                        // MENU NAVIGATION
                        const navigation = outputsRef.current.autoOnOffMenu.navigation;

                        navigation.timerBeforeClose = (30 * 60);

                        const currentIdx = navigation.currentIdx;
                        const currentElement = getCurrentExtendedMenuElement(outputsRef.current.autoOnOffMenu);
                        // const currentElement = outputsRef.current.menu.options[currentIdx];

                        if (currentElement) {
                            if (currentElement.type === 'block') {
                                navigation.openedIdxArray.push(currentIdx);
                                navigation.currentIdx = 0;
                            } else if (currentElement.type === 'property') {
                                // navigation.openedIdxArray.push(currentIdx);
                                // navigation.isValueSelect = true;
                                // navigation.currentIdx = 0;

                                if (navigation.isValueSelect) {

                                    if (currentElement.valueType === 'input') {

                                        const inputData = navigation._inputData;

                                        if (inputData?.type === 'time') {

                                            if (inputData.timeArrayIdx === 0) inputData.timeArrayIdx = 1;
                                            else {
                                                const val = inputData.currentValue;

                                                const result = currentElement.onInput(outputsRef.current.settings, val[0], val[1]);

                                                outputsRef.current.settings = result;

                                                navigation.isValueSelect = false;
                                                navigation._inputData = undefined;
                                                // navigation.valueIdx = null;
                                            }

                                            // if (val[inputData.timeArrayIdx] > 0) {
                                            //     val[inputData.timeArrayIdx]--;
                                            // }

                                            outputsRef.current.resetAnimationsTimer = {
                                                animTimer: true,
                                            };

                                        }

                                    } else if (typeof navigation.valueIdx === 'number') {
                                        const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                                        outputsRef.current.settings = value;

                                        navigation.isValueSelect = false;
                                        navigation.valueIdx = null;
                                    }
                                    // outputsRef.current.menu.navigation._settingsBeforeUpdate = outputsRef.current.settings;

                                } else {
                                    if (currentElement.valueType === 'input') {
                                        navigation._inputData = {
                                            type: "time",
                                            timeArrayIdx: 0,
                                            currentValue: currentElement.initialValue(outputsRef.current.settings) || [0, 0]
                                        };

                                        navigation.isValueSelect = true;
                                        // navigation.valueIdx = currentValueIdx || 0;
                                    } else {
                                        const currentValueIdx = currentElement.values.findIndex(val => val.reference?.(outputsRef.current.settings));

                                        navigation.isValueSelect = true;
                                        navigation.valueIdx = currentValueIdx || 0;
                                    }
                                }
                                // if (currentValueIdx >= 0) {
                                // }
                            } else if (currentElement.type === 'button') {
                                currentElement.onClick();
                                navigation.menuOpened = false;
                            }
                        }
                    }

                });

                processEncoderInput('scroll-right', () => {
                    if (outputsRef.current.autoOnOffMenu.navigation.menuOpened) {
                        // MENU NAVIGATION

                        const navigation = outputsRef.current.autoOnOffMenu.navigation;

                        navigation.timerBeforeClose = (30 * 60);

                        const currentElementBefore = getCurrentExtendedMenuElement(outputsRef.current.autoOnOffMenu, navigation.openedIdxArray);
                        const currentElement = getCurrentExtendedMenuElement(outputsRef.current.autoOnOffMenu);

                        if (navigation.menuType) {
                            const options = outputsRef.current.autoOnOffMenu.options[navigation.menuType];



                            let limit = (options.length - 1);
                            // if (currentElement && navigation.openedIdxArray.length > 0) {
                            if (currentElementBefore?.type === 'block' && navigation.openedIdxArray.length > 0) limit = (currentElementBefore.innerOptions.length - 1);
                            // }
                            // alert(limit);

                            if (navigation.isValueSelect) {

                                if (currentElement?.type === 'property' && currentElement.valueType === 'input') {

                                    const inputData = navigation._inputData;

                                    if (inputData?.type === 'time') {

                                        const val = inputData.currentValue;

                                        if (val[inputData.timeArrayIdx] < (inputData.timeArrayIdx === 0 ? 23 : 59)) {
                                            val[inputData.timeArrayIdx]++;
                                        }

                                        outputsRef.current.resetAnimationsTimer = {
                                            animTimer: true,
                                        };

                                    }

                                } else if (currentElement?.type === 'property' && typeof navigation.valueIdx === 'number') {
                                    if (currentElement?.type === 'property') limit = (currentElement.values.length - 1);

                                    if (navigation.valueIdx < limit) {
                                        navigation.valueIdx++;
                                    }
                                }

                            } else {
                                if (navigation.currentIdx < limit) {
                                    navigation.currentIdx++;
                                }
                            }
                        }
                    }


                });
            } else {

                if (outputsRef.current.powerOn) {
                    if (settings.advanced.autoOnOff.autoOFF.active) {

                        if (outputsRef.current.autoOnOff?.OFF?.activated) {
                            const autoOFF = outputsRef.current.autoOnOff.OFF;

                            if (autoOFF.isInterrupted) {



                            } else {
                                if (autoOnOffTimer % 60 < 30) autoOFF.encoderIndication = true;
                                else autoOFF.encoderIndication = false;

                                if (autoOnOffTimer % 60 === 0) {
                                    if (autoOFF.timer > 0) {
                                        autoOFF.timer--;
                                    } else {
                                        outputsRef.current.powerOn = false;

                                        outputsRef.current.autoOnOff.OFF = {
                                            ...outputsRef.current.autoOnOff.OFF,
                                            activated: false,
                                            // buttonIndication: false,
                                            isInterrupted: false,
                                        };

                                        autoOnOffTimer = 0;
                                    }
                                    beeper.singleBeep(1, settings.audio.beeper.volume, settings.audio.beeper.on);
                                }

                                processEncoderInput('click', () => {
                                    autoOFF.isInterrupted = true;
                                    outputsRef.current.autoOnOffMenu.navigation = {
                                        menuOpened: true,
                                        menuType: "autoOFF",
                                        currentIdx: 0,
                                        openedIdxArray: [],
                                        timerBeforeClose: (30 * 60),
                                    }
                                });
                            }

                            autoOnOffTimer++;

                        } else {
                            const prevActivation = outputsRef.current.autoOnOff?.OFF?.activatedAt;

                            const now = new Date();


                            const activationDate = new Date();
                            activationDate.setHours(...settings.advanced.autoOnOff.autoOFF.time);

                            const allowActivation = prevActivation ? (now.getDate() > prevActivation.getDate()) : true;

                            if (now >= activationDate && allowActivation) {
                                outputsRef.current.autoOnOff = {
                                    ...outputsRef.current.autoOnOff,
                                    OFF: {
                                        activatedAt: new Date(),
                                        activated: true,
                                        timer: 20,
                                    },
                                };
                                autoOnOffTimer = 0;
                            }
                        }

                    }
                } else {
                    if (settings.advanced.autoOnOff.autoON.active) {

                        if (outputsRef.current.autoOnOff?.ON?.activated) {
                            const autoON = outputsRef.current.autoOnOff.ON;

                            if (autoON.isInterrupted) {

                            } else {
                                if (autoOnOffTimer % 60 < 30) autoON.buttonIndication = true;
                                else autoON.buttonIndication = false;

                                if (autoOnOffTimer % 60 === 0) {
                                    if (autoON.timer > 0) {
                                        autoON.timer--;
                                    } else {
                                        outputsRef.current.powerOn = true;
                                        outputsRef.current.autoOnOff.ON = {
                                            ...outputsRef.current.autoOnOff.ON,
                                            activated: false,
                                            // buttonIndication: false,
                                            isInterrupted: false,
                                        };
                                        autoOnOffTimer = 0;
                                    }
                                    beeper.singleBeep(1, settings.audio.beeper.volume, settings.audio.beeper.on);
                                }

                                processEncoderInput('click', () => {
                                    autoON.isInterrupted = true;
                                    outputsRef.current.autoOnOffMenu.navigation = {
                                        menuOpened: true,
                                        menuType: "autoON",
                                        currentIdx: 0,
                                        openedIdxArray: [],

                                        timerBeforeClose: (30 * 60),
                                    }
                                });
                            }

                            autoOnOffTimer++;

                        } else {
                            const prevActivation = outputsRef.current.autoOnOff?.ON?.activatedAt;

                            const now = new Date();

                            const activationDate = new Date();
                            activationDate.setHours(...settings.advanced.autoOnOff.autoON.time);

                            const allowActivation = prevActivation ? (now.getDate() > prevActivation.getDate()) : true;

                            if (now >= activationDate && allowActivation) {
                                outputsRef.current.autoOnOff = {
                                    ...outputsRef.current.autoOnOff,
                                    ON: {
                                        activatedAt: new Date(),
                                        activated: true,
                                        timer: 20,
                                    },
                                };
                                autoOnOffTimer = 0;
                            }
                        }

                    }
                }
            }
        }

        const processExtendedMenuNavigation = (menuObj: MainControllerExtendedMenu<string>, encoderAction: "scroll-left" | "click" | "scroll-right") => {

            if (encoderAction === 'scroll-left') {
                if (menuObj.navigation.menuOpened) {
                    // MENU NAVIGATION

                    const navigation = menuObj.navigation;

                    navigation.timerBeforeClose = (30 * 60);

                    if (navigation.isValueSelect) {

                        const currentElement = getCurrentExtendedMenuElement(menuObj);

                        if (currentElement?.type === 'property' && currentElement.valueType === 'input') {

                            const inputData = navigation._inputData;

                            if (inputData?.type === 'time') {

                                const val = inputData.currentValue;

                                if (val[inputData.timeArrayIdx] > 0) {
                                    val[inputData.timeArrayIdx]--;
                                }

                                outputsRef.current.resetAnimationsTimer = {
                                    animTimer: true,
                                };

                            }

                        } else if (currentElement?.type === 'property' && typeof navigation.valueIdx === 'number') {
                            if (navigation.valueIdx > 0) {
                                navigation.valueIdx--;
                            }
                        }

                        // const currentElement = getCurrentMenuElement(outputsRef.current.menu);
                        // if (currentElement?.type === 'property') {
                        //     const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                        //     outputsRef.current.settings = value;
                        // }
                    } else {
                        if (navigation.currentIdx > 0) {
                            navigation.currentIdx--;
                        }
                    }
                }
            } else if (encoderAction === 'click') {
                if (menuObj.navigation.menuOpened) {
                    // MENU NAVIGATION
                    const navigation = menuObj.navigation;

                    navigation.timerBeforeClose = (30 * 60);

                    const currentIdx = navigation.currentIdx;
                    const currentElement = getCurrentExtendedMenuElement(menuObj);
                    // const currentElement = outputsRef.current.menu.options[currentIdx];

                    if (currentElement) {
                        if (currentElement.type === 'block') {
                            navigation.openedIdxArray.push(currentIdx);
                            navigation.currentIdx = 0;
                        } else if (currentElement.type === 'property') {
                            // navigation.openedIdxArray.push(currentIdx);
                            // navigation.isValueSelect = true;
                            // navigation.currentIdx = 0;

                            if (navigation.isValueSelect) {

                                if (currentElement.valueType === 'input') {

                                    const inputData = navigation._inputData;

                                    if (inputData?.type === 'time') {

                                        if (inputData.timeArrayIdx === 0) inputData.timeArrayIdx = 1;
                                        else {
                                            const val = inputData.currentValue;

                                            const result = currentElement.onInput(outputsRef.current.settings, val[0], val[1]);

                                            outputsRef.current.settings = result;

                                            navigation.isValueSelect = false;
                                            navigation._inputData = undefined;
                                            // navigation.valueIdx = null;
                                        }

                                        // if (val[inputData.timeArrayIdx] > 0) {
                                        //     val[inputData.timeArrayIdx]--;
                                        // }

                                        outputsRef.current.resetAnimationsTimer = {
                                            animTimer: true,
                                        };

                                    }

                                } else if (typeof navigation.valueIdx === 'number') {
                                    const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                                    outputsRef.current.settings = value;

                                    navigation.isValueSelect = false;
                                    navigation.valueIdx = null;
                                }
                                // outputsRef.current.menu.navigation._settingsBeforeUpdate = outputsRef.current.settings;

                            } else {
                                if (currentElement.valueType === 'input') {
                                    navigation._inputData = {
                                        type: "time",
                                        timeArrayIdx: 0,
                                        currentValue: currentElement.initialValue(outputsRef.current.settings) || [0, 0]
                                    };

                                    navigation.isValueSelect = true;
                                    // navigation.valueIdx = currentValueIdx || 0;
                                } else {
                                    const currentValueIdx = currentElement.values.findIndex(val => val.reference?.(outputsRef.current.settings));

                                    navigation.isValueSelect = true;
                                    navigation.valueIdx = currentValueIdx || 0;
                                }
                            }
                            // if (currentValueIdx >= 0) {
                            // }
                        } else if (currentElement.type === 'button') {
                            currentElement.onClick();
                            navigation.menuOpened = false;
                        }
                    }
                }
            } else if (encoderAction === 'scroll-right') {
                if (menuObj.navigation.menuOpened) {
                    // MENU NAVIGATION

                    const navigation = menuObj.navigation;

                    navigation.timerBeforeClose = (30 * 60);

                    const currentElementBefore = getCurrentExtendedMenuElement(menuObj, navigation.openedIdxArray);
                    const currentElement = getCurrentExtendedMenuElement(menuObj);

                    if (navigation.menuType) {
                        const options = menuObj.options[navigation.menuType];



                        let limit = (options.length - 1);
                        // if (currentElement && navigation.openedIdxArray.length > 0) {
                        if (currentElementBefore?.type === 'block' && navigation.openedIdxArray.length > 0) limit = (currentElementBefore.innerOptions.length - 1);
                        // }
                        // alert(limit);

                        if (navigation.isValueSelect) {

                            if (currentElement?.type === 'property' && currentElement.valueType === 'input') {

                                const inputData = navigation._inputData;

                                if (inputData?.type === 'time') {

                                    const val = inputData.currentValue;

                                    if (val[inputData.timeArrayIdx] < (inputData.timeArrayIdx === 0 ? 23 : 59)) {
                                        val[inputData.timeArrayIdx]++;
                                    }

                                    outputsRef.current.resetAnimationsTimer = {
                                        animTimer: true,
                                    };

                                }

                            } else if (currentElement?.type === 'property' && typeof navigation.valueIdx === 'number') {
                                if (currentElement?.type === 'property') limit = (currentElement.values.length - 1);

                                if (navigation.valueIdx < limit) {
                                    navigation.valueIdx++;
                                }
                            }

                        } else {
                            if (navigation.currentIdx < limit) {
                                navigation.currentIdx++;
                            }
                        }
                    }
                }
            }
        }

        const processEncoderInput = (
            action: "scroll-left" | "click" | "scroll-right",
            callback?: () => any,
            holdTimer?: number,
            callbackAfterHold?: () => any,
            // nextHoldCallback?: () => any,
            // afterNextHoldCallback?: () => any
        ) => {
            const inp = (action === 'scroll-right' ? 'right' : (action === 'scroll-left') ? 'left' : 'button');
            if (inputsRef.current.buttons?.encoder?.[inp]) {

                buttonClickTimer++;

                if (action.startsWith('scroll')) {
                    resetDemo();
                    const result = callback?.();
                    if (inp === 'button' && !result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                    else if (!result) beeper.scrollBeep(outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);;

                    inputsRef.current.buttons.encoder[inp] = false;

                } else {
                    if (typeof holdTimer === 'number') {
                        if (buttonClickTimer === holdTimer) {
                            const result = callbackAfterHold?.();
                            if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                            // clickedButton = button;
                        } else if (buttonClickTimer > holdTimer) {
                            // nextHoldCallback?.();
                        }


                    } else if (clickedEncoderBtn !== inp) {
                        resetDemo();
                        const result = callback?.();
                        if (inp === 'button' && !result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                        else if (!result) beeper.scrollBeep(outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);;
                    }
                    clickedEncoderBtn = inp;
                }

            } else if (clickedEncoderBtn === inp) {

                if (typeof holdTimer === 'number' && (buttonClickTimer < holdTimer)) {
                    const result = callback?.();
                    if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                    // alert(123)
                } else if (typeof holdTimer === 'number' && buttonClickTimer > holdTimer) {
                    // afterNextHoldCallback?.();
                } else {
                    // const result = callbackAfterHold?.();
                    // if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                }

                buttonClickTimer = 0;

                clickedEncoderBtn = null;
            }
        }



        const processButtonClick = (
            button: keyof MainControllerInputButtons,
            callback?: () => any,
            holdTimer?: number,
            callbackAfterHold?: () => any,
            nextHoldCallback?: () => any,
            afterNextHoldCallback?: () => any
        ) => {
            if (button === 'encoder') return;
            if (inputsRef.current.buttons?.[button]) {

                buttonClickTimer++;

                resetDemo();

                // if (clickedButton !== button) {
                if (typeof holdTimer === 'number') {
                    if (buttonClickTimer === holdTimer) {
                        const result = callbackAfterHold?.();
                        if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                        // clickedButton = button;
                    } else if (buttonClickTimer > holdTimer) {
                        nextHoldCallback?.();
                    }


                } else if (clickedButton !== button) {
                    const result = callback?.();
                    if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                    clickedButton = button;
                }
                clickedButton = button;

                // }




                // if (clickedButton !== button && typeof holdTimer !== 'number') {
                //     const result = callback?.();
                //     if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                //     clickedButton = button;
                // } else {

                // }

            } else if (clickedButton === button) {

                if (typeof holdTimer === 'number' && (buttonClickTimer < holdTimer)) {
                    const result = callback?.();
                    if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                    // alert(123)
                } else if (typeof holdTimer === 'number' && buttonClickTimer > holdTimer) {
                    afterNextHoldCallback?.();
                } else {
                    // const result = callbackAfterHold?.();
                    // if (!result) beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                }

                buttonClickTimer = 0;

                clickedButton = null;
            }
        }

        // beeper.beep(3);

        let ejectTimer = 0;

        const timeMove = () => {
            const d = outputsRef.current.sourceData;
            if (d[1].timeMove?.on && audioPlayerRef.current) {

                // if (d[1].timeMove.direction === 'right') {
                d[1].timeMove.timer++;
                // } else {
                // d[1].timeMove.timer--;
                // }
                if (d[1].timeMove.timer > 70) {
                    d[1].timeMove.timer = 0;
                    if (d[1].timeMove.interval > 4) d[1].timeMove.interval -= 2;
                }

                d[1].timeMove.isMoving = true;
                if (d[1].timeMove.timer % d[1].timeMove.interval === 0) {
                    if (d[1].timeMove.direction === 'right') {
                        if (audioPlayerRef.current.currentTime < (audioPlayerRef.current.duration - d[1].timeMove.speed)) audioPlayerRef.current.currentTime += d[1].timeMove.speed;
                    } else {
                        if (audioPlayerRef.current.currentTime >= d[1].timeMove.speed) audioPlayerRef.current.currentTime -= d[1].timeMove.speed;
                    }
                    // beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                }
            }
        }

        const processMenuTimers = () => {
            if (outputsRef.current.menu.navigation.menuOpened) {

                // alert(outputsRef.current.menu.navigation.timerBeforeClose)

                if (outputsRef.current.menu.navigation.timerBeforeClose > 0) {
                    outputsRef.current.menu.navigation.timerBeforeClose--;
                } else {
                    outputsRef.current.menu.navigation.menuOpened = false;
                    beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on)
                }

            } else if (outputsRef.current.autoOnOffMenu.navigation.menuOpened) {

                if (outputsRef.current.autoOnOffMenu.navigation.timerBeforeClose > 0) {
                    outputsRef.current.autoOnOffMenu.navigation.timerBeforeClose--;
                } else {
                    outputsRef.current.autoOnOffMenu.navigation.menuOpened = false;
                    beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on)
                }

            }
        }

        let updateTimer = 0;

        const update = () => {
            // alert(outputsRef.current.powerOn)
            // alert(123)
            if (inputsRef.current.buttons) {

                if (inputsRef.current.buttons.powerOnOff && !(
                    outputsRef.current.autoOnOff?.OFF?.activated ||
                    outputsRef.current.autoOnOff?.ON?.activated
                )) {
                    powerBtnTimer++;
                    // alert(123)
                    if (powerBtnTimer > (
                        20
                        // outputsRef.current.powerOn ? 5 : 20
                    )) {
                        outputsRef.current.powerOn = (
                            (outputsRef.current.powerOn) ? false : true
                        );
                        powerBtnTimer = -20;
                    }
                    // console.info('Power On Button!');
                    // outputsRef.current.display = {
                    //     mainData: '    APPELEY     '
                    // }
                } else powerBtnTimer = 0;

                processAutoOnOff();

                if (outputsRef.current.powerOn) {

                    processVolumeControl();

                    processMenuTimers();

                    if (updateTimer % 10 === 0) {
                        applyEQSettings();
                    }

                    updateTimer++;

                    if (audioPlayerRef.current) {
                        // audioPlayerRef.current.volume = (outputsRef.current.mainVolume / 100);
                        if (masterGain) {
                            masterGain.gain.value = outputsRef.current.mainVolume / 100;
                        }
                        // audioPlayerRef.current.volume = clamp(
                        //     (outputsRef.current.mainVolume / 100) * (outputsRef.current.sourceData[1].normalizationGain ?? 1),
                        //     0, 1
                        // );
                    }
                    if (videoOutputRef.current) videoOutputRef.current.volume = (outputsRef.current.mainVolume / 100);

                    if (inputsRef.current.buttons.srcSelect) {
                        if (!outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {
                            srcBtnTimer++;
                            if (srcBtnTimer > 0) {
                                beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);

                                if (outputsRef.current.currentSource === 2) {
                                    // outputsRef.current.sourceData[2].
                                    stopMetadataPolling();
                                }

                                outputsRef.current.currentSource = (
                                    (outputsRef.current.currentSource || 0) + 1
                                );
                                if (outputsRef.current.currentSource > 6) {
                                    outputsRef.current.currentSource = 0;
                                }
                                if (audioPlayerRef.current) {
                                    // audioPlayerRef.current.currentTime = 0;
                                    audioPlayerRef.current.pause();
                                    audioPlayerRef.current = null;
                                    if (outputsRef.current.sourceData[1].playbackData) {
                                        outputsRef.current.sourceData[1].playbackData.isPlaying = false;
                                    }
                                    // audioPlayerRef.current = null;
                                }
                                if (videoOutputRef.current) {
                                    setVideoPowerOn(false);
                                    videoOutputRef.current.pause();
                                    // videoOutputRef.current
                                    if (outputsRef.current.sourceData[1].playbackData) {
                                        outputsRef.current.sourceData[1].playbackData.isPlaying = false;
                                    }
                                }

                                // if (outputsRef.current.currentSource === 2) {
                                //     stopMetadataPolling();
                                // }

                                resetDemo();
                                srcBtnTimer = -20;
                            }
                        }
                    } else srcBtnTimer = 0;

                    // if (inputsRef.current.buttons.disp) {

                    //     if (clickedOtherButton !== 'disp') {
                    //         if (inputsRef.current.isDemoAnimating) resetDemo();
                    //         else {
                    //             outputsRef.current
                    //         }
                    //     }

                    //     clickedOtherButton = 'disp';

                    // }


                    // Old radio capture handler
                    // processButtonClick('num_0', async () => {
                    //     if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) return;

                    //     if (outputsRef.current.currentSource !== 2) return;


                    //     const d2 = outputsRef.current.sourceData[2];
                    //     // if (!d2?.currentStationIndex && d2.currentStationIndex !== 0) return;
                    //     if (typeof d2.currentStationIndex !== 'number') return;


                    //     const station = internetRadioStations[d2.currentStationIndex];
                    //     if (!station) return;

                    //     // alert('Start Recognition');

                    //     outputsRef.current.sourceData[2].recognition = {
                    //         inProgress: true,
                    //         startedAt: Date.now(),
                    //     };

                    //     try {
                    //         const res = await fetch('/api/radio-capture', {
                    //             method: 'POST',
                    //             headers: { 'Content-Type': 'application/json' },
                    //             body: JSON.stringify({
                    //                 url: station.url,
                    //                 durationMs: 10_000,
                    //             }),
                    //         });

                    //         const data = await res.json();

                    //         if (data.success && data.recognition?.success) {
                    //             await createRadioTrackRecord(
                    //                 d2.currentStationId!,
                    //                 `${data.recognition.artist} - ${data.recognition.title}`,
                    //             );

                    //             outputsRef.current.sourceData[2].recognition = {
                    //                 inProgress: false,
                    //                 artist: data.recognition.artist,
                    //                 title: data.recognition.title,
                    //                 result: 'FOUND',
                    //             };
                    //         } else {
                    //             outputsRef.current.sourceData[2].recognition = {
                    //                 inProgress: false,
                    //                 result: 'NOT_FOUND',
                    //                 error: data.recognition?.error || data.error,
                    //             };
                    //         }
                    //     } catch (err) {
                    //         outputsRef.current.sourceData[2].recognition = {
                    //             inProgress: false,
                    //             result: 'ERROR',
                    //             error: String(err),
                    //         };
                    //     }
                    // });

                    processButtonClick('back', () => {

                        if (outputsRef.current.appeleyMediaCenter) {
                            outputsRef.current.appeleyMediaCenter = undefined;
                            outputsRef.current.appeleyMediaCenterMenu.navigation = {
                                currentIdx: 0,
                                openedIdxArray: [],
                                menuOpened: false,
                                // menuType: "selection",
                                timerBeforeClose: (2 / 0),
                            };
                            outputsRef.current.resetAnimationsTimer = {
                                animTimer: true
                            }
                        } else {

                            if (outputsRef.current.menu.navigation.menuOpened) {
                                const openedIdxArray = outputsRef.current.menu.navigation.openedIdxArray;
                                // alert(openedIdxArray.length);
                                const navigation = outputsRef.current.menu.navigation;

                                navigation.timerBeforeClose = (30 * 60);

                                if (navigation.isValueSelect) {

                                    const currentElement = getCurrentMenuElement(outputsRef.current, outputsRef.current.menu);

                                    if (currentElement?.type === 'property' && currentElement.valueType === 'input') {

                                        const inputData = navigation._inputData;

                                        if (inputData?.type === 'time') {

                                            if (inputData.timeArrayIdx === 1) inputData.timeArrayIdx = 0;
                                            else {
                                                // const val = inputData.currentValue;

                                                // const result = currentElement.onInput(outputsRef.current.settings, val[0], val[1]);

                                                // outputsRef.current.settings = result;

                                                navigation.isValueSelect = false;
                                                navigation._inputData = undefined;
                                                // navigation.valueIdx = null;
                                            }

                                            // if (val[inputData.timeArrayIdx] > 0) {
                                            //     val[inputData.timeArrayIdx]--;
                                            // }

                                            outputsRef.current.resetAnimationsTimer = {
                                                animTimer: true,
                                            };

                                        }

                                    } else {
                                        outputsRef.current.menu.navigation.isValueSelect = false;
                                        outputsRef.current.menu.navigation.valueIdx = null;
                                    }
                                } else if (openedIdxArray.length === 0) {
                                    outputsRef.current.menu.navigation.menuOpened = false;
                                } else {
                                    outputsRef.current.menu.navigation.currentIdx = openedIdxArray.pop() || 0;
                                }

                                // if (outputsRef.current.menu.navigation._settingsBeforeUpdate) {
                                //     outputsRef.current.settings = outputsRef.current.menu.navigation._settingsBeforeUpdate;
                                // }
                            }

                            const currentSrc = outputsRef.current.currentSource;
                            if (currentSrc === 1) {
                                const d = outputsRef.current.sourceData[1];
                                if (d.menu?.menuType === 'navigation') {
                                    if (d.menu.subCategory === 'file') {
                                        d.menu.subCategory = null;
                                        d.menu.subIndex = null;

                                        outputsRef.current.resetAnimationsTimer = {
                                            animTimer: true,
                                        };
                                    } else {
                                        d.menu = undefined;
                                    }
                                }
                            } else if (currentSrc === 2) {
                                const d = outputsRef.current.sourceData[2];

                                if (d.navigation) {
                                    d.navigation = undefined;
                                }
                            } else if (currentSrc === 6) {
                                const d = outputsRef.current.sourceData["6"];
                                if (d.ui?.elevatorCoursebotNavigation) {
                                    const navigation = d.ui.elevatorCoursebotNavigation;
                                    if (navigation.navigationTypeSelection) {
                                        d.ui = {
                                            selectedElevator: d.ui.selectedElevator,
                                        }
                                    } else if (navigation.floorSelection) {
                                        d.ui.elevatorCoursebotNavigation = {
                                            floorIdx: navigation.floorIdx,
                                            navigationTypeSelection: {
                                                idx: 0,
                                                types: ["FLOOR SELECTION", "SLOT SELECTION"]
                                            }
                                        };
                                    } else if (navigation.floorSlotView) {
                                        d.ui.elevatorCoursebotNavigation = {
                                            floorIdx: navigation.floorIdx,
                                            navigationTypeSelection: {
                                                idx: 1,
                                                types: ["FLOOR SELECTION", "SLOT SELECTION"]
                                            }
                                        };
                                    } else if (navigation.slotDataView) {
                                        d.ui.elevatorCoursebotNavigation = {
                                            floorIdx: navigation.floorIdx,
                                            floorSlotIdx: navigation.floorSlotIdx,
                                            floorSlotView: true,
                                        };
                                    }
                                } else if (d.ui?.elevatorActionSelection) {

                                    if (d.ui.elevatorActionSelection.currentAction) {
                                        d.ui.elevatorActionSelection.currentAction = undefined;
                                    } else {
                                        d.ui = {
                                            selectedElevator: d.ui.selectedElevator,
                                        }
                                    }

                                } else if (d.ui?.elevatorListSelection) {
                                    d.ui = {
                                        elevatorCategorySelection: true,
                                    };
                                }
                            }

                        }
                    });

                    if (outputsRef.current.discState !== 'eject') {
                        processButtonClick('eject', () => {
                            outputsRef.current.discState = 'eject';
                            ejectTimer = 0;
                        });
                    } else if (outputsRef.current.discState === 'eject') {
                        ejectTimer++;
                        if (ejectTimer > 90) {
                            outputsRef.current.discState = null;
                        }
                    }

                    processButtonClick('menu', () => {
                        if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                        } else {
                            const d = outputsRef.current.sourceData;
                            if (outputsRef.current.currentSource === 1) {
                                let trackNum = d[1].playbackData?.folderNumber ?? 0;
                                d[1].menu = {
                                    menuType: "navigation",
                                    mainIndex: trackNum,

                                    subCategory: null,
                                    subIndex: null,
                                };
                                outputsRef.current.resetAnimationsTimer = {
                                    animTimer: true
                                };
                            } else if (outputsRef.current.currentSource === 2) {
                                if (!d[2].navigation) {
                                    d[2].navigation = {
                                        stationIdx: d[2].currentStationIndex || 0
                                    };
                                }
                                // let trackNum = d[1].playbackData?.folderNumber ?? 0;
                                // d[1].menu = {
                                //     menuType: "navigation",
                                //     mainIndex: trackNum,

                                //     subCategory: null,
                                //     subIndex: null,
                                // };
                                // outputsRef.current.resetAnimationsTimer = {
                                //     animTimer: true
                                // };
                            }
                        }
                    }, 60, () => {
                        if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                        } else if (!outputsRef.current.menu.navigation.menuOpened &&
                            !outputsRef.current.sourceData[1].menu &&
                            !outputsRef.current.sourceData[2].navigation
                        ) {
                            outputsRef.current.menu.navigation = {
                                currentIdx: 0,
                                openedIdxArray: [],
                                menuOpened: true,
                                menuType: "main",
                                timerBeforeClose: (30 * 60),
                            };

                            // outputsRef.current.menu.navigation._settingsBeforeUpdate = outputsRef.current.settings;
                        }
                    });

                    processButtonClick('mediaCenter', () => {
                        if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                        } else {
                            outputsRef.current.appeleyMediaCenter = {
                                isOpened: true,
                            };
                            outputsRef.current.appeleyMediaCenterMenu.navigation = {
                                currentIdx: 0,
                                openedIdxArray: [],
                                menuOpened: true,
                                menuType: "selection",
                                timerBeforeClose: (2 / 0),
                            };
                        }
                    });

                    processEncoderInput('scroll-left', () => {
                        if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {
                            processExtendedMenuNavigation(outputsRef.current.appeleyMediaCenterMenu, 'scroll-left');
                        } else if (outputsRef.current.menu.navigation.menuOpened) {
                            // MENU NAVIGATION

                            const navigation = outputsRef.current.menu.navigation;

                            navigation.timerBeforeClose = (30 * 60);

                            if (navigation.isValueSelect) {

                                const currentElement = getCurrentMenuElement(outputsRef.current, outputsRef.current.menu);

                                if (currentElement?.type === 'property' && currentElement.valueType === 'input') {

                                    const inputData = navigation._inputData;

                                    if (inputData?.type === 'time') {

                                        const val = inputData.currentValue;

                                        if (val[inputData.timeArrayIdx] > 0) {
                                            val[inputData.timeArrayIdx]--;
                                        }

                                        outputsRef.current.resetAnimationsTimer = {
                                            animTimer: true,
                                        };

                                    }

                                } else if (currentElement?.type === 'property' && typeof navigation.valueIdx === 'number') {
                                    if (navigation.valueIdx > 0) {
                                        navigation.valueIdx--;
                                    }
                                }

                                // const currentElement = getCurrentMenuElement(outputsRef.current.menu);
                                // if (currentElement?.type === 'property') {
                                //     const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                                //     outputsRef.current.settings = value;
                                // }
                            } else {
                                if (navigation.currentIdx > 0) {
                                    navigation.currentIdx--;
                                }
                            }
                        } else {


                            if (outputsRef.current.currentSource === 1) {
                                // USB NAVIGATION CONTROLS

                                const d = outputsRef.current.sourceData;

                                if (d[1].menu?.menuType === 'navigation') {
                                    if (d[1].menu.subCategory === 'file' && typeof d[1].menu.subIndex === 'number') {
                                        if (d[1].menu.subIndex > 0) {
                                            d[1].menu.subIndex--;
                                        }
                                    } else {
                                        if (d[1].menu.mainIndex > 0) {
                                            d[1].menu.mainIndex--;
                                        }
                                    }
                                    outputsRef.current.resetAnimationsTimer = {
                                        animTimer: true,
                                    }
                                } else if (d[1].playbackData) {
                                    if (outputsRef.current.mainVolume > 0) {
                                        outputsRef.current.mainVolume -= 1;
                                    }
                                }
                            } else if (outputsRef.current.currentSource === 2) {
                                // INTERNET RADIO CONTROLS

                                // const d = outputsRef.current.sourceData[2];

                                if (outputsRef.current.sourceData[2].navigation) {
                                    const current = outputsRef.current.sourceData[2].navigation.stationIdx;

                                    if (current > 0) {
                                        outputsRef.current.sourceData[2].navigation.stationIdx -= 1;
                                    }
                                } else {

                                    if (outputsRef.current.mainVolume > 0) {
                                        outputsRef.current.resetAnimationsTimer = {
                                            animTimer: true,
                                        }
                                        outputsRef.current.mainVolume -= 1;
                                    }
                                }
                            } else if (outputsRef.current.currentSource === 6) {
                                // MYLIFT CONTROLS

                                const sourceData = outputsRef.current.sourceData["6"];
                                const selectionData = sourceData?.ui?.elevatorListSelection;

                                if (
                                    typeof selectionData?.currentLift === 'number' &&
                                    (selectionData.currentLift > 0)

                                ) {
                                    selectionData.currentLift -= 1;
                                } else if (sourceData.ui?.elevatorCoursebotNavigation) {
                                    const navigation = sourceData.ui.elevatorCoursebotNavigation;

                                    if (navigation.navigationTypeSelection) {
                                        if (navigation.navigationTypeSelection.idx > 0) {
                                            navigation.navigationTypeSelection.idx--;
                                        }
                                    } else if (navigation.floorSelection) {
                                        const limit = Number(sourceData.selectedElevatorData?.floors?.[0]?.displaySymbol || 1);

                                        if (navigation.floorIdx > limit) {
                                            navigation.floorIdx--;
                                        }
                                    } else if (navigation.floorSlotView && typeof navigation.floorSlotIdx === 'number') {

                                        if (navigation.floorSlotIdx > -1) {
                                            navigation.floorSlotIdx--;
                                        }
                                    }


                                } else if (sourceData.ui?.elevatorActionSelection) {
                                    if (sourceData.ui.elevatorActionSelection.currentAction) {
                                        const selected = sourceData.ui.elevatorActionSelection.selection[sourceData.ui.elevatorActionSelection.currentAction];
                                        Object.entries(selected.options).forEach(([key, value]) => {
                                            if (value.control.encoder?.left) {
                                                selected.options[key].value.current = value.control.encoder.left(value.value);
                                            }
                                        });
                                    } else {
                                        let mainIdx = sourceData.ui.elevatorActionSelection.mainIdx;
                                        if (mainIdx > 0) {
                                            sourceData.ui.elevatorActionSelection.mainIdx--;
                                        }
                                    }

                                }
                            }

                        };

                    });

                    processEncoderInput('click', () => {
                        if (outputsRef.current.sourceData[2].recognition) {
                            resetDemo();

                            if (["DONE", "ERROR"].includes(outputsRef.current.sourceData[2].recognition.phase)) {
                                outputsRef.current.sourceData[2].recognition = undefined;
                            }
                        } else if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {
                            processExtendedMenuNavigation(outputsRef.current.appeleyMediaCenterMenu, 'click');
                        } else if (outputsRef.current.menu.navigation.menuOpened) {
                            // MENU NAVIGATION
                            const navigation = outputsRef.current.menu.navigation;

                            navigation.timerBeforeClose = (30 * 60);

                            const currentIdx = navigation.currentIdx;
                            const currentElement = getCurrentMenuElement(outputsRef.current, outputsRef.current.menu);
                            // const currentElement = outputsRef.current.menu.options[currentIdx];

                            if (currentElement) {
                                if (currentElement.type === 'block') {
                                    navigation.openedIdxArray.push(currentIdx);
                                    navigation.currentIdx = 0;
                                } else if (currentElement.type === 'property') {
                                    // navigation.openedIdxArray.push(currentIdx);
                                    // navigation.isValueSelect = true;
                                    // navigation.currentIdx = 0;

                                    if (navigation.isValueSelect) {

                                        if (currentElement.valueType === 'input') {

                                            const inputData = navigation._inputData;

                                            if (inputData?.type === 'time') {

                                                if (inputData.timeArrayIdx === 0) inputData.timeArrayIdx = 1;
                                                else {
                                                    const val = inputData.currentValue;

                                                    const result = currentElement.onInput(outputsRef.current.settings, val[0], val[1]);

                                                    outputsRef.current.settings = result;

                                                    navigation.isValueSelect = false;
                                                    navigation._inputData = undefined;
                                                    // navigation.valueIdx = null;
                                                }

                                                // if (val[inputData.timeArrayIdx] > 0) {
                                                //     val[inputData.timeArrayIdx]--;
                                                // }

                                                outputsRef.current.resetAnimationsTimer = {
                                                    animTimer: true,
                                                };

                                            }

                                        } else if (typeof navigation.valueIdx === 'number') {
                                            const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                                            outputsRef.current.settings = value;

                                            navigation.isValueSelect = false;
                                            navigation.valueIdx = null;
                                        }
                                        // outputsRef.current.menu.navigation._settingsBeforeUpdate = outputsRef.current.settings;

                                    } else {
                                        if (currentElement.valueType === 'input') {
                                            navigation._inputData = {
                                                type: "time",
                                                timeArrayIdx: 0,
                                                currentValue: currentElement.initialValue(outputsRef.current.settings) || [0, 0]
                                            };

                                            navigation.isValueSelect = true;
                                            // navigation.valueIdx = currentValueIdx || 0;
                                        } else {
                                            const currentValueIdx = currentElement.values.findIndex(val => val.reference?.(outputsRef.current.settings));

                                            navigation.isValueSelect = true;
                                            navigation.valueIdx = currentValueIdx || 0;
                                        }
                                    }
                                    // if (currentValueIdx >= 0) {
                                    // }
                                } else if (currentElement.type === 'button') {
                                    currentElement.onClick();
                                    navigation.menuOpened = false;
                                }
                            }
                        } else {


                            if (outputsRef.current.currentSource === 1) {
                                // USB ACTIONS
                                const d = outputsRef.current.sourceData;
                                if (d[1].timeMove?.on) {
                                    d[1].timeMove = undefined;
                                    if (audioPlayerRef.current) audioPlayerRef.current.play();
                                } else if (d[1].menu?.menuType === 'navigation') {
                                    if (d[1].menu.error) return;
                                    if (d[1].menu.subCategory === 'file' && typeof d[1].menu.subIndex === 'number') {
                                        const folder = d[1].menu.mainIndex;
                                        const track = d[1].menu.subIndex;
                                        tryReadTrack(folder, track);

                                        d[1].menu = undefined;
                                    } else {
                                        const playingFolder = d[1].playbackData?.folderNumber ?? 0;
                                        const fileIdx = d[1].playbackData?.trackNumber ?? 0;
                                        d[1].menu.subCategory = 'file';
                                        if (d[1].navigationData?.[
                                            d[1].menu.mainIndex
                                        ].isEmpty) {
                                            d[1].menu.error = 'NO FILE';
                                            setTimeout(() => {
                                                if (d[1].menu) {
                                                    d[1].menu.error = undefined;
                                                    d[1].menu.subCategory = null;
                                                    d[1].menu.subIndex = null;
                                                }
                                            }, 1000);

                                            return beeper.tripleBeep(outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);; // To prevent default beep(1);
                                        }
                                        d[1].menu.subIndex = (playingFolder === d[1].menu.mainIndex) ? fileIdx : 0;
                                    }

                                    outputsRef.current.resetAnimationsTimer = {
                                        animTimer: true,
                                    };
                                } else {
                                    if (d[1].playbackData) {

                                        if (!d[1].playbackData.isPaused) {
                                            audioPlayerRef.current?.pause();
                                            videoOutputRef.current?.pause();
                                            d[1].playbackData.isPaused = true;
                                        } else {
                                            audioPlayerRef.current?.play();
                                            videoOutputRef.current?.play();
                                            d[1].playbackData.isPaused = false;
                                        }

                                    }
                                }
                            } else if (outputsRef.current.currentSource === 2) {
                                // INTERNET RADIO ACTIONS

                                const d2 = outputsRef.current.sourceData[2];

                                if (d2.navigation) {
                                    const idx = d2.navigation.stationIdx;

                                    playRadio(idx);

                                    d2.navigation = undefined;

                                } else {
                                    if (audioPlayerRef.current) {
                                        if (!d2.isPaused) {
                                            audioPlayerRef.current?.pause();
                                            d2.isPaused = true;
                                        } else {
                                            audioPlayerRef.current?.play();
                                            d2.isPaused = false;
                                        }
                                    }
                                }


                            } else if (outputsRef.current.currentSource === 6) {
                                // MYLIFT CONTROLS
                                const sourceData = outputsRef.current.sourceData["6"];

                                if (sourceData.ui?.elevatorCoursebotNavigation) {
                                    const navigation = sourceData.ui.elevatorCoursebotNavigation;

                                    if (navigation.navigationTypeSelection) {
                                        const idx = navigation.navigationTypeSelection.idx;
                                        if (navigation.navigationTypeSelection.types[idx] === 'FLOOR SELECTION') {
                                            sourceData.ui.elevatorCoursebotNavigation = {
                                                floorIdx: navigation.floorIdx,
                                                floorSelection: true
                                            }
                                        } else {
                                            sourceData.ui.elevatorCoursebotNavigation = {
                                                floorIdx: navigation.floorIdx,
                                                floorSlotView: true,
                                                floorSlotIdx: -1, // -1 FOR AUTOSAVE, 0+ FOR OTHER FRAGMENTS
                                            }
                                        }
                                    } else if (navigation.floorSelection) {
                                        navigation.floorSelection = false;
                                        navigation.navigationTypeSelection = {
                                            idx: 0,
                                            types: ["FLOOR SELECTION", "SLOT SELECTION"]
                                        }
                                    } else if (navigation.floorSlotView && typeof navigation.floorSlotIdx === 'number') {
                                        if (navigation.floorSlotIdx === -1 && !sourceData.selectedElevatorData?.coursebot?.slots?.[navigation.floorSlotIdx]?.autosave) {
                                            sourceData.ui.error = 'NO AUTOSAVE';
                                            setTimeout(() => {
                                                if (sourceData.ui) {
                                                    sourceData.ui.error = undefined;
                                                }
                                            }, 1000);

                                            return beeper.tripleBeep(outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                                        } else {
                                            navigation.floorSlotView = false;
                                            navigation.slotDataView = true;
                                            navigation.slotDataIdx = 0;
                                        }
                                    }

                                } else if (!sourceData.ui?.elevatorActionSelection) {
                                    sourceData.ui = {
                                        selectedElevator: sourceData.ui?.selectedElevator,
                                        elevatorActionSelection: {
                                            mainIdx: 0,
                                            items: [
                                                {
                                                    value: "callElevator",
                                                    text: "CALL TO FLOOR",
                                                    onSelect: () => {

                                                    }
                                                },
                                                {
                                                    value: "doorOpen",
                                                    text: "OPEN DOORS",
                                                    onSelect: () => {

                                                    }
                                                },
                                                {
                                                    value: "doorClose",
                                                    text: "CLOSE DOORS",
                                                    onSelect: () => {

                                                    }
                                                },
                                                {
                                                    value: "openCoursebot",
                                                    text: "OPEN COURSEBOT",
                                                    onSelect: () => {
                                                        if (sourceData.ui?.elevatorActionSelection) {
                                                            sourceData.ui.elevatorActionSelection = undefined;
                                                            sourceData.ui.elevatorCoursebotNavigation = {
                                                                navigationTypeSelection: {
                                                                    idx: 0,
                                                                    types: ['FLOOR SELECTION', 'SLOT SELECTION'],
                                                                },
                                                                floorIdx: 1,
                                                            };
                                                        }
                                                    }
                                                }
                                            ],

                                            selection: {
                                                "callElevator": {
                                                    displayText: "CALL TO {floor}F",
                                                    options: {
                                                        floor: {
                                                            value: {
                                                                current: 1,
                                                                min: Number(sourceData.selectedElevatorData?.floors?.[0]?.displaySymbol || 1),
                                                                max: Number(sourceData.selectedElevatorData?.floors?.[
                                                                    (sourceData.selectedElevatorData?.floors?.length) - 1
                                                                ]?.displaySymbol || 1)
                                                            },
                                                            control: {
                                                                encoder: {
                                                                    left: (val: MyLiftElevatorActionOptionValue<number>) => {
                                                                        if ((val.current - 1) < (val.min || 1)) return (val.min || 1);
                                                                        return val.current - 1;
                                                                    },
                                                                    right: (val: MyLiftElevatorActionOptionValue<number>) => {
                                                                        if ((val.current + 1) > (val.max || 1)) return (val.max || 1);
                                                                        return val.current + 1;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }

                                                }
                                            }
                                        }
                                    };
                                } else {
                                    if (sourceData.ui.elevatorActionSelection.currentAction) {
                                        const selected = sourceData.ui.elevatorActionSelection.selection[sourceData.ui.elevatorActionSelection.currentAction];
                                        Object.entries(selected.options).forEach(([key, value]) => {
                                            if (value.control.encoder?.button) {
                                                selected.options[key].value.current = value.control.encoder.button(value.value);
                                            }
                                        });
                                    } else {
                                        const mainIdx = sourceData.ui.elevatorActionSelection.mainIdx;
                                        if (sourceData.ui.elevatorActionSelection.selection[
                                            sourceData.ui.elevatorActionSelection.items[mainIdx].value
                                        ]) {
                                            sourceData.ui.elevatorActionSelection.currentAction = (
                                                sourceData.ui.elevatorActionSelection.items[mainIdx].value
                                            );
                                        } else {
                                            sourceData.ui.elevatorActionSelection.items[mainIdx].onSelect?.();
                                        }
                                    }
                                }
                            }

                        }

                    }, 100, () => {
                        if (!outputsRef.current.menu.navigation.menuOpened) {
                            resetDemo();
                            outputsRef.current.menu.navigation = {
                                currentIdx: 0,
                                openedIdxArray: [],
                                menuOpened: true,
                                menuType: "encoderMenu",
                                timerBeforeClose: (30 * 60)
                            };

                            // outputsRef.current.menu.navigation._settingsBeforeUpdate = outputsRef.current.settings;
                        }
                    });

                    processEncoderInput('scroll-right', () => {
                        if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {
                            processExtendedMenuNavigation(outputsRef.current.appeleyMediaCenterMenu, 'scroll-right');
                        } else if (outputsRef.current.menu.navigation.menuOpened) {
                            // MENU NAVIGATION

                            const navigation = outputsRef.current.menu.navigation;

                            navigation.timerBeforeClose = (30 * 60);

                            const currentElementBefore = getCurrentMenuElement(outputsRef.current, outputsRef.current.menu, navigation.openedIdxArray);
                            const currentElement = getCurrentMenuElement(outputsRef.current, outputsRef.current.menu);

                            const options = (navigation.menuType === 'encoderMenu') ? outputsRef.current.menu.encoderMenuOptions.filter(opt => opt.displayCondition ? opt.displayCondition(outputsRef.current) : true) : outputsRef.current.menu.options.filter(opt => opt.displayCondition ? opt.displayCondition(outputsRef.current) : true);



                            let limit = (options.length - 1);
                            // if (currentElement && navigation.openedIdxArray.length > 0) {
                            if (currentElementBefore?.type === 'block' && navigation.openedIdxArray.length > 0) limit = (currentElementBefore.innerOptions.length - 1);
                            // }
                            // alert(limit);

                            if (navigation.isValueSelect) {

                                if (currentElement?.type === 'property' && currentElement.valueType === 'input') {

                                    const inputData = navigation._inputData;

                                    if (inputData?.type === 'time') {

                                        const val = inputData.currentValue;

                                        if (val[inputData.timeArrayIdx] < (inputData.timeArrayIdx === 0 ? 23 : 59)) {
                                            val[inputData.timeArrayIdx]++;
                                        }

                                        outputsRef.current.resetAnimationsTimer = {
                                            animTimer: true,
                                        };

                                    }

                                } else if (currentElement?.type === 'property' && typeof navigation.valueIdx === 'number') {
                                    if (currentElement?.type === 'property') limit = (currentElement.values.length - 1);

                                    if (navigation.valueIdx < limit) {
                                        navigation.valueIdx++;
                                    }
                                }

                            } else {
                                if (navigation.currentIdx < limit) {
                                    navigation.currentIdx++;
                                }
                            }
                        } else {


                            if (outputsRef.current.currentSource === 1) {
                                // USB CONTROLS

                                const d = outputsRef.current.sourceData;

                                if (d[1].menu?.menuType === 'navigation' && d[1].navigationData) {
                                    const folderIdx = d[1].menu.mainIndex;
                                    if (d[1].menu.subCategory === 'file' && typeof d[1].menu.subIndex === 'number') {
                                        if (d[1].menu.subIndex < (d[1].navigationData[folderIdx].trackList.length - 1)) {
                                            d[1].menu.subIndex++;
                                        }
                                    } else {
                                        if (d[1].menu.mainIndex < (d[1].navigationData.length - 1)) {
                                            d[1].menu.mainIndex++;
                                        }
                                    }
                                    outputsRef.current.resetAnimationsTimer = {
                                        animTimer: true,
                                    }
                                } else if (d[1].playbackData) {
                                    if (outputsRef.current.mainVolume < 100) {
                                        outputsRef.current.mainVolume += 1;
                                    }
                                }
                            } else if (outputsRef.current.currentSource === 2) {
                                // INTERNET RADIO CONTROLS

                                // const d = outputsRef.current.sourceData[2];

                                if (outputsRef.current.sourceData[2].navigation) {
                                    const current = outputsRef.current.sourceData[2].navigation.stationIdx;

                                    if (current < internetRadioStations.length - 1) {
                                        outputsRef.current.sourceData[2].navigation.stationIdx += 1;
                                    }
                                } else {

                                    if (outputsRef.current.mainVolume < 100) {
                                        outputsRef.current.resetAnimationsTimer = {
                                            animTimer: true,
                                        }
                                        outputsRef.current.mainVolume += 1;
                                    }
                                }


                            } else if (outputsRef.current.currentSource === 6) {
                                //  MYLIFT CONTROLS

                                const sourceData = outputsRef.current.sourceData["6"];
                                const selectionData = sourceData?.ui?.elevatorListSelection;

                                if (
                                    typeof selectionData?.currentLift === 'number' &&
                                    (selectionData.currentLift < (sourceData.data.elevators.length - 1))

                                ) {
                                    selectionData.currentLift += 1;
                                    // alert(selectionData.currentLift);
                                } else if (sourceData.ui?.elevatorCoursebotNavigation) {
                                    const navigation = sourceData.ui.elevatorCoursebotNavigation;

                                    if (navigation.navigationTypeSelection) {
                                        if (navigation.navigationTypeSelection.idx < (navigation.navigationTypeSelection.types.length - 1)) {
                                            navigation.navigationTypeSelection.idx++;
                                        }
                                    } else if (navigation.floorSelection) {
                                        const limit = Number(sourceData.selectedElevatorData?.floors?.[
                                            sourceData.selectedElevatorData?.floors.length - 1
                                        ]?.displaySymbol || 1);

                                        if (navigation.floorIdx < limit) {
                                            navigation.floorIdx++;
                                        }
                                    } else if (navigation.floorSlotView && typeof navigation.floorSlotIdx === 'number') {
                                        const limit = Number(sourceData.selectedElevatorData?.coursebot?.slots?.[navigation.floorIdx].fragments.length - 1);

                                        if (navigation.floorSlotIdx < limit) {
                                            navigation.floorSlotIdx++;
                                        }
                                    }


                                } else if (sourceData.ui?.elevatorActionSelection) {
                                    if (sourceData.ui.elevatorActionSelection.currentAction) {
                                        const selected = sourceData.ui.elevatorActionSelection.selection[sourceData.ui.elevatorActionSelection.currentAction];
                                        Object.entries(selected.options).forEach(([key, value]) => {
                                            if (value.control.encoder?.right) {
                                                selected.options[key].value.current = value.control.encoder.right(value.value);
                                            }
                                        });
                                    } else {
                                        let mainIdx = sourceData.ui.elevatorActionSelection.mainIdx;
                                        if (mainIdx < (sourceData.ui.elevatorActionSelection.items.length - 1)) {
                                            sourceData.ui.elevatorActionSelection.mainIdx++;
                                        }
                                    }

                                }
                            }

                        };


                    });

                    if (outputsRef.current.currentSource === 1) {
                        const d = outputsRef.current.sourceData;
                        // alert(123)s
                        if (!outputsRef.current.sourceData) outputsRef.current.sourceData = {
                            1: {},
                            2: {},
                            6: {},
                        };

                        processButtonClick('nextFolder', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else if (!d[1].timeMove?.on) selectFolder('next');
                        });

                        processButtonClick('nextTrack', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else if (!d[1].timeMove?.on) selectTrack('next');
                        }, (d[1].timeMove?.on ? 30 : 120), () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else if (!d[1].isReading && !d[1].error && (
                                typeof d[1].playbackData?.trackNumber === 'number' &&
                                d[1].menu?.menuType !== 'navigation' &&
                                d[1].playbackData.currentTime &&
                                (d[1].playbackData.isPlaying || d[1].playbackData?.isPaused) &&
                                audioPlayerRef.current
                            )) {
                                d[1].timeMove = {
                                    on: true,
                                    direction: 'right',
                                    speed: 1,
                                    interval: 20,
                                    timer: 0,
                                    isMoving: false,
                                };
                                audioPlayerRef.current.pause();
                            }
                        }, () => {
                            timeMove();
                        }, () => {
                            if (d[1].timeMove?.on && audioPlayerRef.current) {
                                d[1].timeMove.timer = 0;
                                d[1].timeMove.isMoving = false;
                                // if (d[1].timeMove.timer % d[1].timeMove.interval === 0) {
                                //     audioPlayerRef.current.currentTime += d[1].timeMove.speed;
                                //     beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                                // }
                            }
                        });

                        processButtonClick('prevFolder', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else if (!d[1].timeMove?.on) selectFolder('prev');
                        });

                        processButtonClick('prevTrack', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else if (!d[1].timeMove?.on) selectTrack('prev');
                        }, (d[1].timeMove?.on ? 30 : 120), () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else if (!d[1].isReading && !d[1].error && (
                                typeof d[1].playbackData?.trackNumber === 'number' &&
                                d[1].menu?.menuType !== 'navigation' &&
                                d[1].playbackData.currentTime &&
                                (d[1].playbackData.isPlaying || d[1].playbackData?.isPaused) &&
                                audioPlayerRef.current
                            )) {
                                d[1].timeMove = {
                                    on: true,
                                    direction: 'left',
                                    speed: 1,
                                    interval: 20,
                                    timer: 0,
                                    isMoving: false,
                                };
                                audioPlayerRef.current.pause();
                            }
                        }, () => {
                            timeMove();
                        }, () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else if (d[1].timeMove?.on && audioPlayerRef.current) {
                                d[1].timeMove.timer = 0;
                                d[1].timeMove.isMoving = false;
                                // if (d[1].timeMove.timer % d[1].timeMove.interval === 0) {
                                //     audioPlayerRef.current.currentTime += d[1].timeMove.speed;
                                //     beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                                // }
                            }
                        });

                        // processButtonClick('menu', () => {
                        //     let trackNum = d[1].playbackData?.folderNumber ?? 0;
                        //     d[1].menu = {
                        //         menuType: "navigation",
                        //         mainIndex: trackNum,

                        //         subCategory: null,
                        //         subIndex: null,
                        //     };
                        //     outputsRef.current.resetAnimationsTimer = {
                        //         animTimer: true
                        //     };
                        // });



                        // for (const key in inputsRef.current.buttons) {
                        //     if (key.startsWith('num_')) {


                        //         // otherBtnClick = 1;
                        //         const button = inputsRef.current.buttons[key as keyof MainControllerInputs['buttons']];
                        //         if (button) {

                        //             if (clickedNumButton !== key) {
                        //                 beeper.beep(1);
                        //                 if (key === `num_1`) {
                        //                     selectFolder('next');
                        //                 } else if (key === 'num_2') {
                        //                     selectFolder('prev');
                        //                 } else if (key === 'num_3') {
                        //                     selectTrack('prev');
                        //                 } else if (key === 'num_4') {
                        //                     selectTrack('next');
                        //                 }
                        //             }

                        //             clickedNumButton = key;
                        //             resetDemo();
                        //             // alert(number)

                        //         } else if (clickedNumButton === key) clickedNumButton = null;



                        //     }
                        // }

                        if (inputsRef.current.sourceData[1].allowReading === true && inputsRef.current.sourceData[1].connectedUSBDevice) {
                            if (d[1].dataToLoad) {
                                if (!d[1].isReading) {
                                    getNavigation().then((data) => {
                                        d[1].navigationData = data as FolderInfo[];

                                        const folder = d[1]?.dataToLoad?.folderNumber ?? 0;
                                        const track = d[1]?.dataToLoad?.trackNumber ?? 0;

                                        tryReadTrack((folder), (track)).then(() => {
                                            d[1].isReading = false;
                                            d[1].dataToLoad = undefined;


                                        }).catch(err => {
                                            tryReadTrack(-1, 0, "next").then(() => {
                                                d[1].isReading = false;
                                                d[1].dataToLoad = undefined;
                                            }).catch((err) => {
                                                console.error("❌ Initial tryReadTrack failed:", err);
                                                d[1].isReading = false;
                                            });
                                        });

                                        // d[1].playbackData = {
                                        //     folderNumber: 1,
                                        // }
                                    }).catch((err) => {
                                        d[1].error = err;
                                        d[1].isReading = false;
                                    });
                                    d[1].isReading = true;
                                }
                            } else if (d[1].playbackData) {
                                if (
                                    d[1].playbackData.trackName ||
                                    d[1].playbackData.albumName ||
                                    d[1].playbackData.artist
                                ) {
                                    d[1].isReadingID3 = false;
                                    if (!d[1].playbackData.isPlaying) {
                                        if (audioPlayerRef.current) {
                                            audioPlayerRef.current.play();
                                        }
                                        if (videoOutputRef.current) {
                                            videoOutputRef.current.play();
                                            setVideoPowerOn(true);
                                        }
                                        d[1].playbackData.isPlaying = true;
                                    }

                                    // processEncoderInput('click', () => {
                                    //     if (d[1].menu?.menuType === 'navigation') {
                                    //         if (d[1].menu.error) return;
                                    //         if (d[1].menu.subCategory === 'file' && typeof d[1].menu.subIndex === 'number') {
                                    //             const folder = d[1].menu.mainIndex;
                                    //             const track = d[1].menu.subIndex;
                                    //             tryReadTrack(folder, track);

                                    //             d[1].menu = undefined;
                                    //         } else {
                                    //             const playingFolder = d[1].playbackData?.folderNumber ?? 0;
                                    //             const fileIdx = d[1].playbackData?.trackNumber ?? 0;
                                    //             d[1].menu.subCategory = 'file';
                                    //             if (d[1].navigationData?.[
                                    //                 d[1].menu.mainIndex
                                    //             ].isEmpty) {
                                    //                 d[1].menu.error = 'NO FILE';
                                    //                 setTimeout(() => {
                                    //                     if (d[1].menu) {
                                    //                         d[1].menu.error = undefined;
                                    //                         d[1].menu.subCategory = null;
                                    //                         d[1].menu.subIndex = null;
                                    //                     }
                                    //                 }, 1000);

                                    //                 return beeper.tripleBeep(outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);; // To prevent default beep(1);
                                    //             }
                                    //             d[1].menu.subIndex = (playingFolder === d[1].menu.mainIndex) ? fileIdx : 0;
                                    //         }

                                    //         outputsRef.current.resetAnimationsTimer = {
                                    //             animTimer: true,
                                    //         };
                                    //     } else {
                                    //         if (d[1].playbackData) {

                                    //             if (!d[1].playbackData.isPaused) {
                                    //                 audioPlayerRef.current?.pause();
                                    //                 videoOutputRef.current?.pause();
                                    //                 d[1].playbackData.isPaused = true;
                                    //             } else {
                                    //                 audioPlayerRef.current?.play();
                                    //                 videoOutputRef.current?.play();
                                    //                 d[1].playbackData.isPaused = false;
                                    //             }

                                    //         }
                                    //     }
                                    // });

                                    // processEncoderInput('scroll-left', () => {
                                    //     if (d[1].menu?.menuType === 'navigation') {
                                    //         if (d[1].menu.subCategory === 'file' && typeof d[1].menu.subIndex === 'number') {
                                    //             if (d[1].menu.subIndex > 0) {
                                    //                 d[1].menu.subIndex--;
                                    //             }
                                    //         } else {
                                    //             if (d[1].menu.mainIndex > 0) {
                                    //                 d[1].menu.mainIndex--;
                                    //             }
                                    //         }
                                    //         outputsRef.current.resetAnimationsTimer = {
                                    //             animTimer: true,
                                    //         }
                                    //     } else if (d[1].playbackData) {
                                    //         if (outputsRef.current.mainVolume > 0) {
                                    //             outputsRef.current.mainVolume -= 1;
                                    //         }
                                    //     }
                                    // });

                                    // processEncoderInput('scroll-right', () => {
                                    //     if (d[1].menu?.menuType === 'navigation' && d[1].navigationData) {
                                    //         const folderIdx = d[1].menu.mainIndex;
                                    //         if (d[1].menu.subCategory === 'file' && typeof d[1].menu.subIndex === 'number') {
                                    //             if (d[1].menu.subIndex < (d[1].navigationData[folderIdx].trackList.length - 1)) {
                                    //                 d[1].menu.subIndex++;
                                    //             }
                                    //         } else {
                                    //             if (d[1].menu.mainIndex < (d[1].navigationData.length - 1)) {
                                    //                 d[1].menu.mainIndex++;
                                    //             }
                                    //         }
                                    //         outputsRef.current.resetAnimationsTimer = {
                                    //             animTimer: true,
                                    //         }
                                    //     } else if (d[1].playbackData) {
                                    //         if (outputsRef.current.mainVolume < 100) {
                                    //             outputsRef.current.mainVolume += 1;
                                    //         }
                                    //     }
                                    // });
                                    // if (inputsRef.current.buttons.encoder?.button) {
                                    //     if (clickedEncoderBtn !== 'center') {
                                    //         beeper.beep(1);
                                    //         if (!d[1].playbackData.isPaused) {
                                    //             audioPlayerRef.current?.pause();
                                    //             d[1].playbackData.isPaused = true;
                                    //         } else {
                                    //             audioPlayerRef.current?.play();
                                    //             d[1].playbackData.isPaused = false;
                                    //         }
                                    //         resetDemo();
                                    //     }

                                    //     clickedEncoderBtn = 'center';
                                    // } else if (clickedEncoderBtn === 'center') clickedEncoderBtn = null;

                                } else if (!d[1].isReadingID3) {
                                    // d[1].isReadingID3 = true;
                                    // getCurrentID3()
                                    //     .catch((err) => {
                                    //         console.warn('ID3 read failed:', err);
                                    //         d[1].isReadingID3 = false;
                                    //     });
                                } else {



                                }
                            } else if (d[1].navigationData) {

                            } else if (d[1].error) {

                            } else {
                                if (!d[1].isReading) {
                                    getNavigation().then((data) => {
                                        d[1].navigationData = data as FolderInfo[];
                                        console.log('NAVIGATION DATA:');
                                        console.log(data);
                                        tryReadTrack(-1, 0, "next").then(() => {
                                            d[1].isReading = false;
                                        });

                                        // d[1].playbackData = {
                                        //     folderNumber: 1,
                                        // }
                                    }).catch((err) => {
                                        d[1].error = err;
                                        d[1].isReading = false;
                                    });
                                    d[1].isReading = true;
                                }
                            }
                            // if (!d[1].isReading && !d[1].error && !d[1].navigationData) {
                            //     getNavigation().then((data) => {
                            //         d[1].navigationData = data as FolderInfo[];
                            //         console.log('NAVIGATION DATA:');
                            //         console.log(data);                                    
                            //         d[1].isReading = false;
                            //         // d[1].playbackData = {
                            //         //     folderNumber: 1,
                            //         // }
                            //     }).catch((err) => {
                            //         d[1].error = err;
                            //         d[1].isReading = false;
                            //     });
                            //     d[1].isReading = true;
                            // }
                        }
                    } else if (outputsRef.current.currentSource === 2) {
                        // FM / Radio

                        if (inputsRef.current.sourceData[2].allowReading !== true) return frameId = requestAnimationFrame(update);

                        if (inputsRef.current.sourceData[2].captureRequest === true) {
                            tryCaptureRadio();
                            inputsRef.current.sourceData[2].captureRequest = false;
                        }

                        const d2 = outputsRef.current.sourceData[2];

                        if (audioPlayerRef.current && !d2.isPaused) audioPlayerRef.current.play().catch(console.error);

                        if (!audioPlayerRef.current) playRadio(d2.currentStationIndex || 0);

                        if (typeof d2.currentStationIndex !== 'number') {
                            playRadio(0);
                            return frameId = requestAnimationFrame(update);
                        }

                        processButtonClick('nextTrack', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else {
                                const next = ((d2.currentStationIndex ?? 0) + 1) % internetRadioStations.length;
                                playRadio(next);
                            }
                        });

                        processButtonClick('prevTrack', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else {
                                const prev = ((d2.currentStationIndex ?? 0) - 1 + internetRadioStations.length) % internetRadioStations.length;
                                playRadio(prev);
                            }
                        });

                        processButtonClick('nextFolder', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else {
                                const next = ((d2.currentStationIndex ?? 0) + 1) % internetRadioStations.length;
                                playRadio(next);
                            }
                        });

                        processButtonClick('prevFolder', () => {
                            if (outputsRef.current.appeleyMediaCenterMenu.navigation.menuOpened) {

                            } else {
                                const prev = ((d2.currentStationIndex ?? 0) - 1 + internetRadioStations.length) % internetRadioStations.length;
                                playRadio(prev);
                            }
                        });

                        // processEncoderInput('click', () => {
                        //     if (audioPlayerRef.current) {
                        //         if (!d2.isPaused) {
                        //             audioPlayerRef.current?.pause();
                        //             d2.isPaused = true;
                        //         } else {
                        //             audioPlayerRef.current?.play();
                        //             d2.isPaused = false;
                        //         }
                        //     }
                        // });

                        // processEncoderInput('scroll-left', () => {
                        //     if (outputsRef.current.mainVolume > 0) {
                        //         outputsRef.current.resetAnimationsTimer = {
                        //             animTimer: true,
                        //         }
                        //         outputsRef.current.mainVolume -= 1;
                        //     }
                        // });

                        // processEncoderInput('scroll-right', () => {
                        //     if (outputsRef.current.mainVolume < 100) {
                        //         outputsRef.current.resetAnimationsTimer = {
                        //             animTimer: true,
                        //         }
                        //         outputsRef.current.mainVolume += 1;
                        //     }
                        // });
                    } else if (outputsRef.current.currentSource === 6) {

                        if (
                            outputsRef.current.sourceData?.["6"].connectionInfo?.ip &&
                            outputsRef.current.sourceData?.["6"].connectionInfo?.port &&
                            outputsRef.current.sourceData?.["6"].connectionInfo?.port.length > 3
                        ) {
                            if (
                                !outputsRef.current.sourceData["6"].isConnecting &&
                                !outputsRef.current.sourceData["6"].isConnected &&
                                !outputsRef.current.sourceData?.["6"].connectionError
                            ) {
                                getMyLiftData(
                                    outputsRef.current.sourceData["6"].connectionInfo.ip,
                                    outputsRef.current.sourceData["6"].connectionInfo.port,
                                ).then((data: any) => {
                                    if (outputsRef.current.sourceData) {
                                        outputsRef.current.sourceData["6"].isConnected = true;
                                        outputsRef.current.sourceData["6"].isConnecting = false;
                                        outputsRef.current.sourceData["6"].data = data;

                                        outputsRef.current.sourceData["6"].ui = {
                                            elevatorCategorySelection: true,
                                        }
                                        // alert(JSON.stringify(data));
                                    }
                                }).catch((r) => {
                                    if (outputsRef.current.sourceData) {
                                        outputsRef.current.sourceData["6"].isConnected = false;
                                        outputsRef.current.sourceData["6"].isConnecting = false;
                                        outputsRef.current.sourceData["6"].connectionError = r;
                                    }
                                });
                                outputsRef.current.sourceData["6"].isConnecting = true;
                            } else {

                                const sourceData = outputsRef.current.sourceData["6"];

                                if (sourceData.ui?.elevatorCategorySelection) {

                                    if (inputsRef.current.buttons.encoder?.button) {

                                        if (clickedEncoderBtn !== 'center') {
                                            beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                                            sourceData.ui.elevatorCategorySelection = false;
                                            sourceData.ui.elevatorListSelection = {
                                                currentLift: 0,
                                            };
                                        }

                                        clickedEncoderBtn = 'center';
                                        resetDemo();
                                    } else if (clickedEncoderBtn === 'center') clickedEncoderBtn = null;

                                } else if (sourceData.ui?.elevatorListSelection) {

                                    const selectionData = sourceData.ui.elevatorListSelection;

                                    // if (inputsRef.current.buttons.back) {
                                    //     sourceData.ui = {
                                    //         elevatorCategorySelection: true,
                                    //     };
                                    //     resetDemo();
                                    // }

                                    // processEncoderInput('scroll-left', () => {
                                    //     if (
                                    //         typeof selectionData.currentLift === 'number' &&
                                    //         (selectionData.currentLift > 0)

                                    //     ) {
                                    //         selectionData.currentLift -= 1;
                                    //     }
                                    // });

                                    // processEncoderInput('scroll-right', () => {
                                    //     if (
                                    //         typeof selectionData.currentLift === 'number' &&
                                    //         (selectionData.currentLift < (sourceData.data.elevators.length - 1))

                                    //     ) {
                                    //         selectionData.currentLift += 1;
                                    //         // alert(selectionData.currentLift);
                                    //     }
                                    // });

                                    // if (inputsRef.current.buttons.encoder?.left) {
                                    //     if (clickedEncoderBtn !== 'left') {
                                    //         if (
                                    //             typeof selectionData.currentLift === 'number' &&
                                    //             (selectionData.currentLift > 0)

                                    //         ) {
                                    //             selectionData.currentLift -= 1;
                                    //         }
                                    //         // alert(selectionData.currentLift);
                                    //     }

                                    //     clickedEncoderBtn = 'left';
                                    //     resetDemo();
                                    // } else if (clickedEncoderBtn === 'left') clickedEncoderBtn = null;

                                    // if (inputsRef.current.buttons.encoder?.right) {
                                    //     if (clickedEncoderBtn !== 'right') {
                                    //         if (
                                    //             typeof selectionData.currentLift === 'number' &&
                                    //             (selectionData.currentLift < (sourceData.data.elevators.length - 1))

                                    //         ) {
                                    //             selectionData.currentLift += 1;
                                    //             // alert(selectionData.currentLift);
                                    //         }
                                    //     }

                                    //     clickedEncoderBtn = 'right';
                                    //     resetDemo();
                                    // } else if (clickedEncoderBtn === 'right') clickedEncoderBtn = null;

                                    if (inputsRef.current.buttons.encoder?.button && typeof selectionData.currentLift === 'number') {
                                        if (clickedEncoderBtn !== 'center') {
                                            beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                                            sourceData.ui = {
                                                selectedElevator: {
                                                    liftId: sourceData.data.elevators[selectionData.currentLift].id,
                                                    liftNumber: selectionData.currentLift,
                                                }
                                            };
                                            getCurrentMyLiftElevator(sourceData.data.elevators[selectionData.currentLift].id, sourceData.connectionInfo?.ip, sourceData.connectionInfo?.port).then((data) => {
                                                sourceData.selectedElevatorData = data;
                                                if (sourceData.ui?.selectedElevator) sourceData.ui.selectedElevator.floorNumber = 1;
                                            });
                                        }
                                        clickedEncoderBtn = 'center';
                                    } else if (clickedEncoderBtn === 'center') clickedEncoderBtn = null;
                                } else if (sourceData.ui?.selectedElevator) {

                                    if (sourceData.selectedElevatorData) {
                                        // processEncoderInput('click', () => {
                                        //     if (sourceData.ui?.elevatorCoursebotNavigation) {
                                        //         const navigation = sourceData.ui.elevatorCoursebotNavigation;

                                        //         if (navigation.navigationTypeSelection) {
                                        //             const idx = navigation.navigationTypeSelection.idx;
                                        //             if (navigation.navigationTypeSelection.types[idx] === 'FLOOR SELECTION') {
                                        //                 sourceData.ui.elevatorCoursebotNavigation = {
                                        //                     floorIdx: navigation.floorIdx,
                                        //                     floorSelection: true
                                        //                 }
                                        //             } else {
                                        //                 sourceData.ui.elevatorCoursebotNavigation = {
                                        //                     floorIdx: navigation.floorIdx,
                                        //                     floorSlotView: true,
                                        //                     floorSlotIdx: -1, // -1 FOR AUTOSAVE, 0+ FOR OTHER FRAGMENTS
                                        //                 }
                                        //             }
                                        //         } else if (navigation.floorSelection) {
                                        //             navigation.floorSelection = false;
                                        //             navigation.navigationTypeSelection = {
                                        //                 idx: 0,
                                        //                 types: ["FLOOR SELECTION", "SLOT SELECTION"]
                                        //             }
                                        //         } else if (navigation.floorSlotView && typeof navigation.floorSlotIdx === 'number') {
                                        //             if (navigation.floorSlotIdx === -1 && !sourceData.selectedElevatorData?.coursebot?.slots?.[navigation.floorSlotIdx]?.autosave) {
                                        //                 sourceData.ui.error = 'NO AUTOSAVE';
                                        //                 setTimeout(() => {
                                        //                     if (sourceData.ui) {
                                        //                         sourceData.ui.error = undefined;
                                        //                     }
                                        //                 }, 1000);

                                        //                 return beeper.tripleBeep(outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                                        //             } else {
                                        //                 navigation.floorSlotView = false;
                                        //                 navigation.slotDataView = true;
                                        //                 navigation.slotDataIdx = 0;
                                        //             }
                                        //         }

                                        //     } else if (!sourceData.ui?.elevatorActionSelection) {
                                        //         sourceData.ui = {
                                        //             selectedElevator: sourceData.ui?.selectedElevator,
                                        //             elevatorActionSelection: {
                                        //                 mainIdx: 0,
                                        //                 items: [
                                        //                     {
                                        //                         value: "callElevator",
                                        //                         text: "CALL TO FLOOR",
                                        //                         onSelect: () => {

                                        //                         }
                                        //                     },
                                        //                     {
                                        //                         value: "doorOpen",
                                        //                         text: "OPEN DOORS",
                                        //                         onSelect: () => {

                                        //                         }
                                        //                     },
                                        //                     {
                                        //                         value: "doorClose",
                                        //                         text: "CLOSE DOORS",
                                        //                         onSelect: () => {

                                        //                         }
                                        //                     },
                                        //                     {
                                        //                         value: "openCoursebot",
                                        //                         text: "OPEN COURSEBOT",
                                        //                         onSelect: () => {
                                        //                             if (sourceData.ui?.elevatorActionSelection) {
                                        //                                 sourceData.ui.elevatorActionSelection = undefined;
                                        //                                 sourceData.ui.elevatorCoursebotNavigation = {
                                        //                                     navigationTypeSelection: {
                                        //                                         idx: 0,
                                        //                                         types: ['FLOOR SELECTION', 'SLOT SELECTION'],
                                        //                                     },
                                        //                                     floorIdx: 1,
                                        //                                 };
                                        //                             }
                                        //                         }
                                        //                     }
                                        //                 ],

                                        //                 selection: {
                                        //                     "callElevator": {
                                        //                         displayText: "CALL TO {floor}F",
                                        //                         options: {
                                        //                             floor: {
                                        //                                 value: {
                                        //                                     current: 1,
                                        //                                     min: Number(sourceData.selectedElevatorData?.floors?.[0]?.displaySymbol || 1),
                                        //                                     max: Number(sourceData.selectedElevatorData?.floors?.[
                                        //                                         (sourceData.selectedElevatorData?.floors?.length) - 1
                                        //                                     ]?.displaySymbol || 1)
                                        //                                 },
                                        //                                 control: {
                                        //                                     encoder: {
                                        //                                         left: (val: MyLiftElevatorActionOptionValue<number>) => {
                                        //                                             if ((val.current - 1) < (val.min || 1)) return (val.min || 1);
                                        //                                             return val.current - 1;
                                        //                                         },
                                        //                                         right: (val: MyLiftElevatorActionOptionValue<number>) => {
                                        //                                             if ((val.current + 1) > (val.max || 1)) return (val.max || 1);
                                        //                                             return val.current + 1;
                                        //                                         }
                                        //                                     }
                                        //                                 }
                                        //                             }
                                        //                         }

                                        //                     }
                                        //                 }
                                        //             }
                                        //         };
                                        //     } else {
                                        //         if (sourceData.ui.elevatorActionSelection.currentAction) {
                                        //             const selected = sourceData.ui.elevatorActionSelection.selection[sourceData.ui.elevatorActionSelection.currentAction];
                                        //             Object.entries(selected.options).forEach(([key, value]) => {
                                        //                 if (value.control.encoder?.button) {
                                        //                     selected.options[key].value.current = value.control.encoder.button(value.value);
                                        //                 }
                                        //             });
                                        //         } else {
                                        //             const mainIdx = sourceData.ui.elevatorActionSelection.mainIdx;
                                        //             if (sourceData.ui.elevatorActionSelection.selection[
                                        //                 sourceData.ui.elevatorActionSelection.items[mainIdx].value
                                        //             ]) {
                                        //                 sourceData.ui.elevatorActionSelection.currentAction = (
                                        //                     sourceData.ui.elevatorActionSelection.items[mainIdx].value
                                        //                 );
                                        //             } else {
                                        //                 sourceData.ui.elevatorActionSelection.items[mainIdx].onSelect?.();
                                        //             }
                                        //         }
                                        //     }
                                        // });

                                        // processEncoderInput('scroll-left', () => {
                                        //     if (sourceData.ui?.elevatorCoursebotNavigation) {
                                        //         const navigation = sourceData.ui.elevatorCoursebotNavigation;

                                        //         if (navigation.navigationTypeSelection) {
                                        //             if (navigation.navigationTypeSelection.idx > 0) {
                                        //                 navigation.navigationTypeSelection.idx--;
                                        //             }
                                        //         } else if (navigation.floorSelection) {
                                        //             const limit = Number(sourceData.selectedElevatorData?.floors?.[0]?.displaySymbol || 1);

                                        //             if (navigation.floorIdx > limit) {
                                        //                 navigation.floorIdx--;
                                        //             }
                                        //         } else if (navigation.floorSlotView && typeof navigation.floorSlotIdx === 'number') {

                                        //             if (navigation.floorSlotIdx > -1) {
                                        //                 navigation.floorSlotIdx--;
                                        //             }
                                        //         }


                                        //     } else if (sourceData.ui?.elevatorActionSelection) {
                                        //         if (sourceData.ui.elevatorActionSelection.currentAction) {
                                        //             const selected = sourceData.ui.elevatorActionSelection.selection[sourceData.ui.elevatorActionSelection.currentAction];
                                        //             Object.entries(selected.options).forEach(([key, value]) => {
                                        //                 if (value.control.encoder?.left) {
                                        //                     selected.options[key].value.current = value.control.encoder.left(value.value);
                                        //                 }
                                        //             });
                                        //         } else {
                                        //             let mainIdx = sourceData.ui.elevatorActionSelection.mainIdx;
                                        //             if (mainIdx > 0) {
                                        //                 sourceData.ui.elevatorActionSelection.mainIdx--;
                                        //             }
                                        //         }

                                        //     }
                                        // });

                                        // processEncoderInput('scroll-right', () => {
                                        //     if (sourceData.ui?.elevatorCoursebotNavigation) {
                                        //         const navigation = sourceData.ui.elevatorCoursebotNavigation;

                                        //         if (navigation.navigationTypeSelection) {
                                        //             if (navigation.navigationTypeSelection.idx < (navigation.navigationTypeSelection.types.length - 1)) {
                                        //                 navigation.navigationTypeSelection.idx++;
                                        //             }
                                        //         } else if (navigation.floorSelection) {
                                        //             const limit = Number(sourceData.selectedElevatorData?.floors?.[
                                        //                 sourceData.selectedElevatorData?.floors.length - 1
                                        //             ]?.displaySymbol || 1);

                                        //             if (navigation.floorIdx < limit) {
                                        //                 navigation.floorIdx++;
                                        //             }
                                        //         } else if (navigation.floorSlotView && typeof navigation.floorSlotIdx === 'number') {
                                        //             const limit = Number(sourceData.selectedElevatorData?.coursebot?.slots?.[navigation.floorIdx].fragments.length - 1);

                                        //             if (navigation.floorSlotIdx < limit) {
                                        //                 navigation.floorSlotIdx++;
                                        //             }
                                        //         }


                                        //     } else if (sourceData.ui?.elevatorActionSelection) {
                                        //         if (sourceData.ui.elevatorActionSelection.currentAction) {
                                        //             const selected = sourceData.ui.elevatorActionSelection.selection[sourceData.ui.elevatorActionSelection.currentAction];
                                        //             Object.entries(selected.options).forEach(([key, value]) => {
                                        //                 if (value.control.encoder?.right) {
                                        //                     selected.options[key].value.current = value.control.encoder.right(value.value);
                                        //                 }
                                        //             });
                                        //         } else {
                                        //             let mainIdx = sourceData.ui.elevatorActionSelection.mainIdx;
                                        //             if (mainIdx < (sourceData.ui.elevatorActionSelection.items.length - 1)) {
                                        //                 sourceData.ui.elevatorActionSelection.mainIdx++;
                                        //             }
                                        //         }

                                        //     }
                                        // });
                                    }

                                }

                            }
                        }

                        for (const key in inputsRef.current.buttons) {
                            if (key.startsWith('num_')) {


                                // otherBtnClick = 1;
                                const button = inputsRef.current.buttons[key as keyof MainControllerInputs['buttons']];
                                if (button) {

                                    if (clickedNumButton !== key) {
                                        beeper.singleBeep(1, outputsRef.current.settings.audio.beeper.volume, outputsRef.current.settings.audio.beeper.on);
                                        if (!outputsRef.current.sourceData) outputsRef.current.sourceData = {
                                            1: {},
                                            2: {},
                                            6: {},
                                        };

                                        if (!outputsRef.current.sourceData["6"].connectionInfo) outputsRef.current.sourceData["6"].connectionInfo = {};

                                        let number = key.replace(/\D/g, "");


                                        if (!outputsRef.current.sourceData["6"].connectionInfo.ip || outputsRef.current.sourceData["6"].connectionInfo.ip?.indexOf(" ") > -1) {
                                            if (
                                                !outputsRef.current.sourceData["6"].connectionInfo.ip
                                            ) outputsRef.current.sourceData["6"].connectionInfo.ip = "   .   .   . ";


                                            outputsRef.current.sourceData["6"].connectionInfo.ip = (
                                                outputsRef.current.sourceData["6"].connectionInfo.ip.replace(" ", number)
                                            );
                                        } else {
                                            if (
                                                !outputsRef.current.sourceData["6"].connectionInfo.port
                                            ) outputsRef.current.sourceData["6"].connectionInfo.port = "";


                                            if (outputsRef.current.sourceData["6"].connectionInfo.port.length < 4) {
                                                outputsRef.current.sourceData["6"].connectionInfo.port += number;
                                            }
                                        }
                                    }

                                    clickedNumButton = key;
                                    resetDemo();
                                    // alert(number)

                                } else if (clickedNumButton === key) clickedNumButton = null;



                            }
                        }

                    }
                    // outputsRef.current.display = {
                    //     mainData: '    APPELEY     '
                    // }
                    // displayUpdateTimer++;

                    // if (displayUpdateTimer > 60) {
                    // }
                } else {
                    if (audioPlayerRef.current) {
                        audioPlayerRef.current.pause();
                        if (outputsRef.current.sourceData[1].playbackData) {
                            outputsRef.current.sourceData[1].playbackData.isPlaying = false;
                        }
                        // audioPlayerRef.current.currentTime = 0;
                    }

                    setVideoPowerOn(false);
                    if (videoOutputRef.current) {
                        videoOutputRef.current.pause();
                        if (outputsRef.current.sourceData[1].playbackData) {
                            outputsRef.current.sourceData[1].playbackData.isPlaying = false;
                        }
                    }
                    // displayUpdateTimer = 0;
                    // outputsRef.current.display = {};
                }


            }

            // inputsRef.current = {};

            frameId = requestAnimationFrame(update);
        };

        frameId = requestAnimationFrame(update);

        // return () => cancelAnimationFrame(frameId);

        return () => {
            cancelAnimationFrame(frameId);

            const connected = inputsRef.current.sourceData[1].connectedUSBDevice;
            if (connected?.kind === 'local') {
                const navigationData = outputsRef.current.sourceData[1].navigationData || [];
                navigationData.forEach(folder => {
                    folder.trackList.forEach(track => {
                        if (track.url?.startsWith('blob:')) {
                            URL.revokeObjectURL(track.url);
                        }
                    });
                });
            }
        };


    }, []);

    return (
        <div className="main-controller"></div>
    )
}