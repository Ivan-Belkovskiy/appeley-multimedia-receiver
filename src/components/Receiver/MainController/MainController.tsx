import { getNavigationData, getTrackID3 } from "@/app/actions";
import beeper from "@/utils/beeper";
import { RefObject, useEffect, useRef } from "react";

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
        };
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
    trackName?: string;
    albumName?: string;
    artist?: string;
    currentTime?: number;

    isPlaying?: boolean;
    isPaused?: boolean;

}

export interface FolderInfo {
    number: number;
    name: string;
    path: string;
    isEmpty: boolean;
    trackList: string[];
    // trackCount: number;
}

export interface MainControllerOutputs {
    powerOn?: boolean;
    currentSource?: MainControllerSources;

    mainVolume: number;

    settings?: {
        demo?: {
            on?: boolean;
            interval?: number;
        };
    };

    resetDemo?: boolean; // To reset demo

    discState?: "load" | "eject" | null;

    sourceData: {
        1: {
            // USB
            isReading?: boolean;
            isReadingID3?: boolean;
            error?: string;
            playbackData?: MainControllerUSBPlaybackData;
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

            ui?: {
                elevatorCategorySelection?: boolean;
                elevatorListSelection?: {
                    currentLift?: number;
                };
                selectedElevator?: {
                    liftNumber: number;
                }

            };
        }
    };

    // currentSource?: MainControllerSource;
    display?: {
        color1?: string;
        color2?: string;
        // mainData?: string;
        // secondaryData?: string;
    };

    resetAnimationsTimer?: {
        animTimer?: boolean;
    }
}

export default function MainController({
    inputsRef,
    outputsRef
}: {
    inputsRef: RefObject<MainControllerInputs>,
    outputsRef: RefObject<MainControllerOutputs>
}) {

    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    // useEffect(() => {
    //     alert(123)
    // if (inputsRef.current.buttons) {

    //     if (inputsRef.current.buttons.powerOnOff) console.info('Power On Button!')

    // }
    // }, [inputsRef.current]);

    useEffect(() => {
        let frameId: number;

        let powerBtnTimer = 0;


        let srcBtnTimer = 0;

        let clickedNumButton: string | null = null;

        let clickedEncoderBtn: string | null = null;

        let clickedOtherButton: string | null = null;

        let displayUpdateTimer = 0;

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

        const getNavigation = () => new Promise(async (resolve, reject) => {
            try {
                const data = await getNavigationData();
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

                const currentFolder = sourceData.navigationData.find(v => v.number === sourceData.playbackData!.folderNumber);


                const folderUrl = currentFolder?.path;
                const trackName = currentFolder?.trackList[sourceData.playbackData.trackNumber];
                // alert(`folderUrl: ${folderUrl}\ntrackName: ${trackName}\nfolder: ${JSON.stringify(currentFolder?.trackList)}`)
                if (!folderUrl || !trackName) throw new Error('Folder url or track name not provided!');

                const { id3 } = await getTrackID3(folderUrl, trackName);

                if (!id3) throw new Error('ID3 Tag reading error!');

                // resolve({
                //     trackName: id3.common.title || trackName,
                //     albumName: id3.common.album || sourceData.navigationData[sourceData.playbackData.folderNumber].name,
                //     artist: id3.common.artist,
                //     // ...id3,

                // });
                resolve(true);

                sourceData.playbackData.trackName = (id3.common.title || trackName);
                sourceData.playbackData.albumName = (id3.common.album || sourceData.navigationData[sourceData.playbackData.folderNumber].name);
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

                const trackName = current.trackList[trackNumber];

                const encodedPath = encodeURIComponent(current.path);
                const encodedName = encodeURIComponent(trackName);

                if (audioPlayerRef.current) {

                    audioPlayerRef.current.src = (
                        `/api/track?folderUrl=${encodedPath}&trackName=${encodedName}`
                    );

                    // audioPlayerRef.current.currentTime = 0;
                    audioPlayerRef.current.play();

                    if (outputsRef.current.sourceData[1].playbackData) {
                        outputsRef.current.sourceData[1].playbackData.isPlaying = true;
                    }

                } else audioPlayerRef.current = new Audio(
                    `/api/track?folderUrl=${encodedPath}&trackName=${encodedName}`
                );

                audioPlayerRef.current.volume = (outputsRef.current.mainVolume / 100);

                // audio.addEventListener('error', (e) => alert(e));
                const canplayHandler = () => {
                    console.log('AUDIO LOADED! URL: ', audioPlayerRef.current?.src);
                    audioPlayerRef.current?.play();
                    resolve(true);

                    if (outputsRef.current.sourceData[1].playbackData) {
                        outputsRef.current.sourceData[1].playbackData.isPlaying = true;
                    }

                    outputsRef.current.sourceData[1].playbackData = {
                        folderNumber: available.number,
                        trackNumber,
                    };
                    // alert(`FolderNumber: ${folder}\ntrackNumber: ${trackNumber}`)
                };

                audioPlayerRef.current.addEventListener('canplay', canplayHandler);
                audioPlayerRef.current.addEventListener('timeupdate', () => {
                    if (outputsRef.current.sourceData[1].playbackData) {
                        outputsRef.current.sourceData[1].playbackData.currentTime = (
                            audioPlayerRef.current?.currentTime || undefined
                        )
                    }
                    // setPlaybackData?.({
                    //     ...playbackData?.current,
                    //     currentTime: audioPlayerRef.current?.currentTime,
                    // });
                });
                audioPlayerRef.current.addEventListener('ended', () => {
                    tryReadTrack(folder, (track + 1));
                });



            } catch (error) {
                // beeper.beep(3);
                reject(error);
            }
        });

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

                if (clickedEncoderBtn !== inp) {
                    resetDemo();
                    const result = callback?.();
                    if (inp === 'button' && !result) beeper.singleBeep(1);
                    clickedEncoderBtn = inp;
                }

            } else if (clickedEncoderBtn === inp) clickedEncoderBtn = null;
        }

        const processButtonClick = (
            button: keyof MainControllerInputButtons,
            callback?: () => any,
        ) => {
            if (button === 'encoder') return;
            if (inputsRef.current.buttons?.[button]) {

                resetDemo();


                if (clickedButton !== button) {
                    const result = callback?.();
                    if (!result) beeper.singleBeep(1);
                    clickedButton = button;
                }

            } else if (clickedButton === button) clickedButton = null;
        }

        // beeper.beep(3);

        let ejectTimer = 0;

        const update = () => {
            // alert(outputsRef.current.powerOn)
            if (inputsRef.current.buttons) {

                if (inputsRef.current.buttons.powerOnOff) {
                    powerBtnTimer++;
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
                            if (d.ui?.elevatorListSelection) {
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

                    if (outputsRef.current.currentSource === 1) {
                        const d = outputsRef.current.sourceData;
                        // alert(123)s
                        if (!outputsRef.current.sourceData) outputsRef.current.sourceData = {
                            1: {},
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

                        processButtonClick('menu', () => {
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
                        });



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

                        if (inputsRef.current.sourceData[1].allowReading === true) {
                            if (d[1].dataToLoad) {
                                if (!d[1].isReading) {
                                    getNavigation().then((data) => {
                                        d[1].navigationData = data as FolderInfo[];

                                        const folder = d[1]?.dataToLoad?.folderNumber ?? 0;
                                        const track = d[1]?.dataToLoad?.trackNumber ?? 0;

                                        tryReadTrack((folder), (track)).then(() => {
                                            d[1].isReading = false;
                                            d[1].dataToLoad = undefined;
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
                                    if (!d[1].playbackData.isPlaying && audioPlayerRef.current) {
                                        audioPlayerRef.current.play();
                                        d[1].playbackData.isPlaying = true;
                                    }

                                    processEncoderInput('click', () => {
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
                                                    d[1].playbackData.isPaused = true;
                                                } else {
                                                    audioPlayerRef.current?.play();
                                                    d[1].playbackData.isPaused = false;
                                                }

                                            }
                                        }
                                    });

                                    processEncoderInput('scroll-left', () => {
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
                                    });

                                    processEncoderInput('scroll-right', () => {
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
                                    });
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
                                        tryReadTrack(0, 0, "next").then(() => {
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

                                    if (inputsRef.current.buttons.encoder?.left) {
                                        if (clickedEncoderBtn !== 'left') {
                                            if (
                                                typeof selectionData.currentLift === 'number' &&
                                                (selectionData.currentLift > 0)

                                            ) {
                                                selectionData.currentLift -= 1;
                                            }
                                            // alert(selectionData.currentLift);
                                        }

                                        clickedEncoderBtn = 'left';
                                        resetDemo();
                                    } else if (clickedEncoderBtn === 'left') clickedEncoderBtn = null;

                                    if (inputsRef.current.buttons.encoder?.right) {
                                        if (clickedEncoderBtn !== 'right') {
                                            if (
                                                typeof selectionData.currentLift === 'number' &&
                                                (selectionData.currentLift < (sourceData.data.elevators.length - 1))

                                            ) {
                                                selectionData.currentLift += 1;
                                                // alert(selectionData.currentLift);
                                            }
                                        }

                                        clickedEncoderBtn = 'right';
                                        resetDemo();
                                    } else if (clickedEncoderBtn === 'right') clickedEncoderBtn = null;

                                    if (inputsRef.current.buttons.encoder?.button && typeof selectionData.currentLift === 'number') {
                                        if (clickedEncoderBtn !== 'center') {
                                            beeper.singleBeep(1);
                                            sourceData.ui = {
                                                selectedElevator: {
                                                    liftNumber: selectionData.currentLift,
                                                }
                                            };
                                        }
                                        clickedEncoderBtn = 'center';
                                    } else if (clickedEncoderBtn === 'center') clickedEncoderBtn = null;
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