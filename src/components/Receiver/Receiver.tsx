'use client';

import { useEffect, useRef, useState } from "react";
import FrontPanel from "./FrontPanel/FrontPanel";
import MainController, { MainControllerInputs, MainControllerOutputs } from "./MainController/MainController";
import { loadData, saveData } from "@/app/actions";

export default function AppeleyReceiver() {

    const controllerInputsRef = useRef<MainControllerInputs>({
        sourceData: {
            1: {}
        }
    });
    const controllerOutputsRef = useRef<MainControllerOutputs>({
        currentSource: 1,
        mainVolume: 10,
        display: {
            color1: "#72bdff",
            color2: "#22384b"
        },
        sourceData: {
            // 0: {}, // uncomment after adding to interface MainControllerOutputs
            1: {},
            // 2: {}, // uncomment after adding to interface MainControllerOutputs
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
            controllerOutputsRef.current.display = res.data.outputs.display;
            
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

            if (res.data.outputs.sourceData[5]) {
                controllerOutputsRef.current.sourceData[5] = res.data.outputs.sourceData[5];
            }
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
            <MainController inputsRef={controllerInputsRef} outputsRef={controllerOutputsRef} />
            <FrontPanel
                mainControllerInputsRef={controllerInputsRef}
                mainControllerOutputsRef={controllerOutputsRef}
            />
        </div>
    )
}