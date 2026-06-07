import { RefObject, useEffect } from "react";

export interface MainControllerInputs {
    buttons?: {
        powerOnOff?: boolean;
    }
};

export interface MainControllerOutputs {
    powerOn?: boolean;
    display?: {
        color1?: string;
        color2?: string;
        // mainData?: string;
        // secondaryData?: string;
    }
}

export default function MainController({
    inputsRef,
    outputsRef
}: {
    inputsRef: RefObject<MainControllerInputs>,
    outputsRef: RefObject<MainControllerOutputs>
}) {

    // useEffect(() => {
    //     alert(123)
    // if (inputsRef.current.buttons) {

    //     if (inputsRef.current.buttons.powerOnOff) console.info('Power On Button!')

    // }
    // }, [inputsRef.current]);

    useEffect(() => {
        let frameId: number;

        let powerBtnTimer = 0;

        let displayUpdateTimer = 0;

        const update = () => {
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
                    // outputsRef.current.display = {
                    //     mainData: '    APPELEY     '
                    // }
                    // displayUpdateTimer++;

                    // if (displayUpdateTimer > 60) {
                    // }
                } else {
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