import { createRadioTrackRecord, getNavigationData, getTrackID3, InternetRadioStation, USBFlashInfo } from "@/app/actions";
import beeper from "@/utils/beeper";
import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from "react";
import { getCurrentMenuElement } from "../FrontPanel/FrontPanel";
import { Prisma } from "@prisma/client";

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
        }
    }

    isDemoAnimating?: boolean;

    buttons?: MainControllerInputButtons;
};

export enum MainControllerSources {
    "DISC",
    "USB",
    "FM",
    "AV-IN",
    "BT AUDIO",
    "MYLIFT"
}

export type MainControllerSource = "DISC" | "USB" | "FM" | "AV-IN" | "BT AUDIO" | "MYLIFT";

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

    dataType: "audio" | "video";
    // trackName?: string;
    // albumName?: string;
    artist?: string;
    currentTime?: number;
    trackDuration?: number;

    isPlaying?: boolean;
    isPaused?: boolean;

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

export type MenuOption = {
    type: "block";
    label: string;

    innerOptions: MenuOption[];


    // type: "block" | "property";
    // label: string;

} | {
    type: "property";
    label: string;

    values: MenuOptionValue[];
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
    };
    audio: {
        volumeControl: "AUTO" | "NONE";
    }
}

export interface MainControllerMenuDefinition {
    navigation: {
        _settingsBeforeUpdate?: MainControllerSettings | null;
        menuOpened?: boolean;
        currentIdx: number;
        openedIdxArray: number[];

        isValueSelect?: boolean;
        valueIdx?: number | null;
    };
    // currentOption?: MenuOption;
    // currentIdx?: number;

    options: MenuOption[];
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
            }

            // isMenuOpened?: boolean;
            // isNavigationOpened?: boolean;
        };
        2: {
            // FM / Radio
            isPaused?: boolean;
            currentStationId?: number;
            isBuffering?: boolean;
            error?: string;

            currentTitle?: string;
            currentArtist?: string;
            streamTitle?: string;
        };
        5: {
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

    // currentSource?: MainControllerSource;
    indicationColor?: {
        display?: string;
        buttons?: string;
        // mainData?: string;
        // secondaryData?: string;
    };

    resetAnimationsTimer?: {
        animTimer?: boolean;
    }
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

    // useEffect(() => {
    //     alert(123)
    // if (inputsRef.current.buttons) {

    //     if (inputsRef.current.buttons.powerOnOff) console.info('Power On Button!')

    // }
    // }, [inputsRef.current]);
    const metadataSourceRef = useRef<EventSource | null>(null);


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

        const startMetadataListener = (streamUrl: string) => {
            if (metadataSourceRef.current) {
                metadataSourceRef.current.close();
            }

            const eventSource = new EventSource(
                `/api/radio-metadata?url=${encodeURIComponent(streamUrl)}`
            );

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        console.error('Metadata error:', data.error);
                        return;
                    }
                    if (data.title || data.artist) {
                        outputsRef.current.sourceData[2].currentTitle = data.title;
                        outputsRef.current.sourceData[2].currentArtist = data.artist;
                        outputsRef.current.sourceData[2].streamTitle = data.raw;
                        if (_radioStreamText !== data.raw && _radioStationId !== outputsRef.current.sourceData[2].currentStationId) {
                            if (outputsRef.current.sourceData[2].currentStationId) {
                                saveRadioTrackToDb(outputsRef.current.sourceData[2].currentStationId, data.raw);
                            }
                            _radioStreamText = data.raw;
                            _radioStationId = outputsRef.current.sourceData[2].currentStationId || null;
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse metadata:', e);
                }
            };

            eventSource.onerror = (err) => {
                console.error('EventSource error:', err);
            };

            metadataSourceRef.current = eventSource;
        };

        const stopMetadataListener = () => {
            if (metadataSourceRef.current) {
                metadataSourceRef.current.close();
                metadataSourceRef.current = null;
            }
        };

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

        const getNavigation = () => new Promise(async (resolve, reject) => {
            try {
                const usbId = inputsRef.current.sourceData[1].connectedUSBDevice?.id;
                if (!usbId) throw new Error("No USB device connected!");
                const data = await getNavigationData(usbId);
                resolve(data.data);
            } catch (error) {
                reject(error);
            }
        });

        const getCurrentID3 = () => new Promise(async (resolve, reject) => {
            try {
                if (!outputsRef.current.sourceData[1]) throw new Error('Source data not provided!');

                const sourceData = outputsRef.current.sourceData[1];

                if (!sourceData.playbackData || !sourceData.navigationData) throw new Error('Playback or navigation data not provided!');

                const currentFolder = sourceData.navigationData.find(
                    v => v.number === sourceData.playbackData!.folderNumber
                );
                const track = currentFolder?.trackList[sourceData.playbackData.trackNumber];
                if (!track) throw new Error("Track not found!");

                const { id3 } = await getTrackID3(track.url);

                if (!id3) throw new Error('ID3 Tag reading error!');

                // resolve({
                //     trackName: id3.common.title || trackName,
                //     albumName: id3.common.album || sourceData.navigationData[sourceData.playbackData.folderNumber].name,
                //     artist: id3.common.artist,
                //     // ...id3,

                // });
                resolve(true);

                sourceData.playbackData.trackName = {
                    isID3Tag: (id3.common.title ? true : false),
                    data: (id3.common.title || track.name)
                };
                sourceData.playbackData.albumName = {
                    isID3Tag: (id3.common.album ? true : false),
                    data: (id3.common.album || sourceData.navigationData[sourceData.playbackData.folderNumber].name)
                };
                sourceData.playbackData.artist = id3.common.artist;

            } catch (error) {
                reject(error);
            }
        });

        const tryReadTrack = (folder: number, track: number, folderOffset?: "next" | "prev") => new Promise((resolve, reject) => {
            try {
                const navigationData = outputsRef.current.sourceData[1].navigationData;
                if (!navigationData) throw new Error('Navigation data not provided!');

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

                // alert(available.path);
                // }

                // alert(123)

                let trackNumber = track;

                if (trackNumber < 0) trackNumber = 0;
                if (trackNumber > current.trackList.length - 1) {
                    trackNumber = (current.trackList.length - 1);
                    return tryReadTrack(folder, 0, 'next');
                }

                // if (trackNumber > current.trackCount - 1) trackNumber = (current.trackCount - 1);

                const trackData = current.trackList[trackNumber];

                const encodedPath = encodeURIComponent(current.path);
                const encodedName = encodeURIComponent(trackData.name);

                if (trackData.type === 'audio') {
                    if (audioPlayerRef.current) {
                        audioPlayerRef.current.pause();
                        audioPlayerRef.current.removeAttribute('src');
                        audioPlayerRef.current.load();
                    }
                    if (videoOutputRef.current) videoOutputRef.current.src = '';

                    const audio = new Audio();
                    audio.preload = 'metadata';
                    audio.volume = outputsRef.current.mainVolume / 100;
                    audio.src = trackData.url;

                    audioPlayerRef.current = audio;

                    const onCanPlay = () => {
                        console.log('AUDIO LOADED:', trackData.url);
                        audio.removeEventListener('canplay', onCanPlay);
                        audio.play().then(() => resolve(true)).catch(reject);
                        outputsRef.current.sourceData[1].playbackData = {
                            folderNumber: available.number,
                            trackNumber,
                            dataType: "audio",
                            trackDuration: audio.duration,
                        };
                    };

                    const onTimeUpdate = () => {
                        if (outputsRef.current.sourceData[1].playbackData) {
                            outputsRef.current.sourceData[1].playbackData.currentTime = audio.currentTime;
                        }
                    };

                    const onEnded = () => {
                        audio.removeEventListener('timeupdate', onTimeUpdate);
                        audio.removeEventListener('ended', onEnded);
                        selectTrack('next');
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
                        videoOutputRef.current.src = trackData.url;
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

            startMetadataListener(station.url);

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

            outputsRef.current.sourceData[2].currentStationId = station.id;
            outputsRef.current.sourceData[2].isBuffering = true;

            // if (outputsRef.current.sourceData[1]) {
            //     outputsRef.current.sourceData[1].playbackData = undefined;
            // }

            beeper.singleBeep(1);
        };

        const selectFolder = (direction: "next" | "prev") => {
            // alert(direction);
            if (
                // outputsRef.current.sourceData[1].playbackData?.trackNumber &&
                typeof outputsRef.current.sourceData[1].playbackData?.folderNumber === 'number'
            ) {
                // const track = outputsRef.current.sourceData[1].playbackData?.trackNumber;
                const folder = outputsRef.current.sourceData[1].playbackData?.folderNumber;

                if (direction === 'next') {
                    tryReadTrack((folder), 0, "next");
                } else tryReadTrack((folder), 0, "prev");
            }
        }

        const selectTrack = (direction: "next" | "prev") => {
            if (
                typeof outputsRef.current.sourceData[1].playbackData?.trackNumber === 'number' &&
                typeof outputsRef.current.sourceData[1].playbackData.folderNumber === 'number'
            ) {
                const folder = outputsRef.current.sourceData[1].playbackData?.folderNumber;
                const track = outputsRef.current.sourceData[1].playbackData.trackNumber;

                if (direction === 'next') {
                    tryReadTrack((folder), (track + 1));
                } else tryReadTrack((folder), (track - 1));
            }
        }

        const resetDemo = () => {
            outputsRef.current.resetDemo = true;
        }

        let clickedButton: keyof MainControllerInputButtons | null = null;

        const processEncoderInput = (
            action: "scroll-left" | "click" | "scroll-right",
            callback?: () => any
        ) => {
            const inp = (action === 'scroll-right' ? 'right' : (action === 'scroll-left') ? 'left' : 'button');
            if (inputsRef.current.buttons?.encoder?.[inp]) {

                if (action.startsWith('scroll')) {
                    resetDemo();
                    const result = callback?.();
                    if (inp === 'button' && !result) beeper.singleBeep(1);
                    else if (!result) beeper.scrollBeep();

                    inputsRef.current.buttons.encoder[inp] = false;

                } else if (clickedEncoderBtn !== inp) {
                    resetDemo();
                    const result = callback?.();
                    if (inp === 'button' && !result) beeper.singleBeep(1);
                    else if (!result) beeper.scrollBeep();
                    clickedEncoderBtn = inp;
                }

            } else if (clickedEncoderBtn === inp) clickedEncoderBtn = null;
        }

        let buttonClickTimer = 0;

        const processButtonClick = (
            button: keyof MainControllerInputButtons,
            callback?: () => any,
            holdTimer?: number,
            callbackAfterHold?: () => any
        ) => {
            if (button === 'encoder') return;
            if (inputsRef.current.buttons?.[button]) {

                buttonClickTimer++;

                resetDemo();

                // if (clickedButton !== button) {
                if (typeof holdTimer === 'number') {
                    if (buttonClickTimer === holdTimer) {
                        const result = callbackAfterHold?.();
                        if (!result) beeper.singleBeep(1);
                        // clickedButton = button;
                    }


                } else if (clickedButton !== button) {
                    const result = callback?.();
                    if (!result) beeper.singleBeep(1);
                    clickedButton = button;
                }
                clickedButton = button;

                // }




                // if (clickedButton !== button && typeof holdTimer !== 'number') {
                //     const result = callback?.();
                //     if (!result) beeper.singleBeep(1);
                //     clickedButton = button;
                // } else {

                // }

            } else if (clickedButton === button) {

                if (typeof holdTimer === 'number' && (buttonClickTimer < holdTimer)) {
                    const result = callback?.();
                    if (!result) beeper.singleBeep(1);
                    // alert(123)
                } else {
                    // const result = callbackAfterHold?.();
                    // if (!result) beeper.singleBeep(1);
                }

                buttonClickTimer = 0;

                clickedButton = null;
            }
        }

        // beeper.beep(3);

        let ejectTimer = 0;

        const update = () => {
            // alert(outputsRef.current.powerOn)
            // alert(123)
            if (inputsRef.current.buttons) {

                if (inputsRef.current.buttons.powerOnOff) {
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

                if (outputsRef.current.powerOn) {

                    if (audioPlayerRef.current) audioPlayerRef.current.volume = (outputsRef.current.mainVolume / 100);
                    if (videoOutputRef.current) videoOutputRef.current.volume = (outputsRef.current.mainVolume / 100);

                    if (inputsRef.current.buttons.srcSelect) {
                        srcBtnTimer++;
                        if (srcBtnTimer > 0) {
                            beeper.singleBeep(1);
                            outputsRef.current.currentSource = (
                                (outputsRef.current.currentSource || 0) + 1
                            );
                            if (outputsRef.current.currentSource > 5) {
                                outputsRef.current.currentSource = 0;
                            }
                            if (audioPlayerRef.current) {
                                // audioPlayerRef.current.currentTime = 0;
                                audioPlayerRef.current.pause();
                                if (outputsRef.current.sourceData[1].playbackData) {
                                    outputsRef.current.sourceData[1].playbackData.isPlaying = false;
                                }
                                // audioPlayerRef.current = null;
                            }
                            if (videoOutputRef.current) {
                                setVideoPowerOn(false);
                                videoOutputRef.current.pause();
                                if (outputsRef.current.sourceData[1].playbackData) {
                                    outputsRef.current.sourceData[1].playbackData.isPlaying = false;
                                }
                            }

                            if (outputsRef.current.currentSource === 2) {
                                stopMetadataListener();
                            }

                            resetDemo();
                            srcBtnTimer = -20;
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

                    processButtonClick('back', () => {

                        if (outputsRef.current.menu.navigation.menuOpened) {
                            const openedIdxArray = outputsRef.current.menu.navigation.openedIdxArray;
                            // alert(openedIdxArray.length);
                            if (outputsRef.current.menu.navigation.isValueSelect) {
                                outputsRef.current.menu.navigation.isValueSelect = false;
                                outputsRef.current.menu.navigation.valueIdx = null;
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
                        } else if (currentSrc === 5) {
                            const d = outputsRef.current.sourceData[5];
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
                        }
                    }, 60, () => {
                        if (!outputsRef.current.menu.navigation.menuOpened) {
                            outputsRef.current.menu.navigation = {
                                currentIdx: 0,
                                openedIdxArray: [],
                                menuOpened: true,
                            };

                            // outputsRef.current.menu.navigation._settingsBeforeUpdate = outputsRef.current.settings;
                        }
                    });

                    processEncoderInput('scroll-left', () => {
                        if (outputsRef.current.menu.navigation.menuOpened) {
                            // MENU NAVIGATION

                            const navigation = outputsRef.current.menu.navigation;

                            if (navigation.isValueSelect && typeof navigation.valueIdx === 'number') {
                                if (navigation.valueIdx > 0) {
                                    navigation.valueIdx--;
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

                                if (outputsRef.current.mainVolume > 0) {
                                    outputsRef.current.resetAnimationsTimer = {
                                        animTimer: true,
                                    }
                                    outputsRef.current.mainVolume -= 1;
                                }
                            } else if (outputsRef.current.currentSource === 5) {
                                // MYLIFT CONTROLS

                                const sourceData = outputsRef.current.sourceData[5];
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
                        if (outputsRef.current.menu.navigation.menuOpened) {
                            // MENU NAVIGATION
                            const navigation = outputsRef.current.menu.navigation;
                            const currentIdx = navigation.currentIdx;
                            const currentElement = getCurrentMenuElement(outputsRef.current.menu);
                            // const currentElement = outputsRef.current.menu.options[currentIdx];

                            if (currentElement) {
                                if (currentElement.type === 'block') {
                                    navigation.openedIdxArray.push(currentIdx);
                                    navigation.currentIdx = 0;
                                } else if (currentElement.type === 'property') {
                                    // navigation.openedIdxArray.push(currentIdx);
                                    // navigation.isValueSelect = true;
                                    // navigation.currentIdx = 0;

                                    if (navigation.isValueSelect && typeof navigation.valueIdx === 'number') {
                                        const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                                        outputsRef.current.settings = value;
                                        // outputsRef.current.menu.navigation._settingsBeforeUpdate = outputsRef.current.settings;

                                        navigation.isValueSelect = false;
                                        navigation.valueIdx = null;
                                    } else {
                                        const currentValueIdx = currentElement.values.findIndex(val => val.reference?.(outputsRef.current.settings));

                                        navigation.isValueSelect = true;
                                        navigation.valueIdx = currentValueIdx || 0;
                                    }
                                    // if (currentValueIdx >= 0) {
                                    // }
                                }
                            }
                        } else {


                            if (outputsRef.current.currentSource === 1) {
                                // USB ACTIONS
                                const d = outputsRef.current.sourceData;
                                if (d[1].menu?.menuType === 'navigation') {
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

                                            return beeper.tripleBeep(); // To prevent default beep(1);
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

                                if (audioPlayerRef.current) {
                                    if (!d2.isPaused) {
                                        audioPlayerRef.current?.pause();
                                        d2.isPaused = true;
                                    } else {
                                        audioPlayerRef.current?.play();
                                        d2.isPaused = false;
                                    }
                                }
                            } else if (outputsRef.current.currentSource === 5) {
                                // MYLIFT CONTROLS
                                const sourceData = outputsRef.current.sourceData[5];

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

                                            return beeper.tripleBeep()
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

                    });

                    processEncoderInput('scroll-right', () => {
                        if (outputsRef.current.menu.navigation.menuOpened) {
                            // MENU NAVIGATION

                            const navigation = outputsRef.current.menu.navigation;
                            const currentElementBefore = getCurrentMenuElement(outputsRef.current.menu, navigation.openedIdxArray);
                            const currentElement = getCurrentMenuElement(outputsRef.current.menu);


                            let limit = (outputsRef.current.menu.options.length - 1);
                            // if (currentElement && navigation.openedIdxArray.length > 0) {
                            if (currentElementBefore?.type === 'block' && navigation.openedIdxArray.length > 0) limit = (currentElementBefore.innerOptions.length - 1);
                            // }
                            // alert(limit);

                            if (navigation.isValueSelect && typeof navigation.valueIdx === 'number') {
                                if (currentElement?.type === 'property') limit = (currentElement.values.length - 1);

                                if (navigation.valueIdx < limit) {
                                    navigation.valueIdx++;
                                }

                                // const currentElement = getCurrentMenuElement(outputsRef.current.menu);
                                // if (currentElement?.type === 'property') {
                                //     const value = currentElement.values[navigation.valueIdx].onSelect(outputsRef.current.settings);
                                //     outputsRef.current.settings = value;
                                // }
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

                                if (outputsRef.current.mainVolume < 100) {
                                    outputsRef.current.resetAnimationsTimer = {
                                        animTimer: true,
                                    }
                                    outputsRef.current.mainVolume += 1;
                                }
                            } else if (outputsRef.current.currentSource === 5) {
                                //  MYLIFT CONTROLS

                                const sourceData = outputsRef.current.sourceData[5];
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
                            5: {},
                        };

                        processButtonClick('nextFolder', () => {
                            selectFolder('next');
                        });

                        processButtonClick('nextTrack', () => {
                            selectTrack('next');
                        });

                        processButtonClick('prevFolder', () => {
                            selectFolder('prev');
                        });

                        processButtonClick('prevTrack', () => {
                            selectTrack('prev');
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

                                    //                 return beeper.tripleBeep(); // To prevent default beep(1);
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
                                    getCurrentID3();
                                    d[1].isReadingID3 = true;
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

                        const d2 = outputsRef.current.sourceData[2];

                        if (audioPlayerRef.current && !d2.isPaused) audioPlayerRef.current.play().catch(console.error);

                        if (typeof d2.currentStationId !== 'number') {
                            playRadio(0);
                            return frameId = requestAnimationFrame(update);
                        }

                        processButtonClick('nextTrack', () => {
                            const next = ((d2.currentStationId ?? 0) + 1) % internetRadioStations.length;
                            playRadio(next);
                        });

                        processButtonClick('prevTrack', () => {
                            const prev = ((d2.currentStationId ?? 0) - 1 + internetRadioStations.length) % internetRadioStations.length;
                            playRadio(prev);
                        });

                        processButtonClick('nextFolder', () => {
                            const next = ((d2.currentStationId ?? 0) + 1) % internetRadioStations.length;
                            playRadio(next);
                        });

                        processButtonClick('prevFolder', () => {
                            const prev = ((d2.currentStationId ?? 0) - 1 + internetRadioStations.length) % internetRadioStations.length;
                            playRadio(prev);
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
                    } else if (outputsRef.current.currentSource === 5) {

                        if (
                            outputsRef.current.sourceData?.[5].connectionInfo?.ip &&
                            outputsRef.current.sourceData?.[5].connectionInfo?.port &&
                            outputsRef.current.sourceData?.[5].connectionInfo?.port.length > 3
                        ) {
                            if (
                                !outputsRef.current.sourceData[5].isConnecting &&
                                !outputsRef.current.sourceData[5].isConnected &&
                                !outputsRef.current.sourceData?.[5].connectionError
                            ) {
                                getMyLiftData(
                                    outputsRef.current.sourceData[5].connectionInfo.ip,
                                    outputsRef.current.sourceData[5].connectionInfo.port,
                                ).then((data: any) => {
                                    if (outputsRef.current.sourceData) {
                                        outputsRef.current.sourceData[5].isConnected = true;
                                        outputsRef.current.sourceData[5].isConnecting = false;
                                        outputsRef.current.sourceData[5].data = data;

                                        outputsRef.current.sourceData[5].ui = {
                                            elevatorCategorySelection: true,
                                        }
                                        // alert(JSON.stringify(data));
                                    }
                                }).catch((r) => {
                                    if (outputsRef.current.sourceData) {
                                        outputsRef.current.sourceData[5].isConnected = false;
                                        outputsRef.current.sourceData[5].isConnecting = false;
                                        outputsRef.current.sourceData[5].connectionError = r;
                                    }
                                });
                                outputsRef.current.sourceData[5].isConnecting = true;
                            } else {

                                const sourceData = outputsRef.current.sourceData[5];

                                if (sourceData.ui?.elevatorCategorySelection) {

                                    if (inputsRef.current.buttons.encoder?.button) {

                                        if (clickedEncoderBtn !== 'center') {
                                            beeper.singleBeep(1);
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
                                            beeper.singleBeep(1);
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

                                        //                 return beeper.tripleBeep()
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
                                        beeper.singleBeep(1);
                                        if (!outputsRef.current.sourceData) outputsRef.current.sourceData = {
                                            1: {},
                                            2: {},
                                            5: {},
                                        };

                                        if (!outputsRef.current.sourceData[5].connectionInfo) outputsRef.current.sourceData[5].connectionInfo = {};

                                        let number = key.replace(/\D/g, "");


                                        if (!outputsRef.current.sourceData[5].connectionInfo.ip || outputsRef.current.sourceData[5].connectionInfo.ip?.indexOf(" ") > -1) {
                                            if (
                                                !outputsRef.current.sourceData[5].connectionInfo.ip
                                            ) outputsRef.current.sourceData[5].connectionInfo.ip = "   .   .   . ";


                                            outputsRef.current.sourceData[5].connectionInfo.ip = (
                                                outputsRef.current.sourceData[5].connectionInfo.ip.replace(" ", number)
                                            );
                                        } else {
                                            if (
                                                !outputsRef.current.sourceData[5].connectionInfo.port
                                            ) outputsRef.current.sourceData[5].connectionInfo.port = "";


                                            if (outputsRef.current.sourceData[5].connectionInfo.port.length < 4) {
                                                outputsRef.current.sourceData[5].connectionInfo.port += number;
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

        return () => cancelAnimationFrame(frameId);

    }, []);

    return (
        <div className="main-controller"></div>
    )
}