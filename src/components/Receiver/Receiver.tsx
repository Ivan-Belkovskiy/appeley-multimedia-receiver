'use client';

import { useRef } from "react";
import FrontPanel from "./FrontPanel/FrontPanel";
import MainController, { MainControllerInputs, MainControllerOutputs } from "./MainController/MainController";

export default function AppeleyReceiver() {

    const controllerInputsRef = useRef<MainControllerInputs>({});
    const controllerOutputsRef = useRef<MainControllerOutputs>({
        display: {
            color1: "#72bdff",
            color2: "#22384b"
        }
    });

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