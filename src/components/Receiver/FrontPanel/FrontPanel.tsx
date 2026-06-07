'use client';

import { RefObject, useEffect, useRef, useState } from "react";
import Display, { DisplayMainIndication } from "./Display/Display";
import "./FrontPanel.css";
import { MainControllerInputs, MainControllerOutputs } from "../MainController/MainController";

interface DisplayData {
    main: DisplayMainIndication[];
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

    const [outputValues, setOutputValues] = useState<MainControllerOutputs>({});


    const mainInputs = mainControllerInputsRef.current;
    const mainOutputs = mainControllerOutputsRef.current;

    useEffect(() => {
        let frameId: number;


        let displayAction: string | null = null;
        let animTimer = 0;
        let updateTimer = 0;

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

        const update = () => {

            // setDisplayData({
            //     ...displayData,
            //     main: ["", "", "", "", "A", "P", "P", "E", "L", "E", "Y", "", "", "", "", ""]
            // });

            setOutputValues(mainOutputs);

            // if (typeof outputValues === 'undefined') setOutputValues(mainOutputs);
            // else {

            // if (mainOutputs.powerOn) {
            // alert(updateTimer);
            // setOutputValues({
            //     powerOn: mainOutputs.powerOn
            // });

            if (mainOutputs.powerOn) {

                if (updateTimer > 20) {

                    if (updateTimer < 140) {
                        animatePowerOnLogo(Math.floor((updateTimer - 20) / 1));
                        animTimer = 0;
                    } else if (animTimer < 16) {
                        if (updateTimer % Math.floor(
                            // 5
                            ((32 - (animTimer * 2)) / 6)
                        ) === 0) {
                            updateDisplayData({
                                main: (
                                    displayDataRef.current.main.map((s, idx) => {
                                        if (animTimer < 16) {
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
                    }
                    // setDisplayData({
                    //     ...displayData,
                    //     main: ["", "", "", "", "A", "P", "P", "E", "L", "E", "Y", "", "", "", "", ""]
                    // });
                } else setDisplayData({
                    main: []
                    // main: mainOutputs.display.mainData?.split('') || []
                });

                updateTimer++;
            }
            // }

            // }

            frameId = requestAnimationFrame(update);
        };

        frameId = requestAnimationFrame(update);

        return () => cancelAnimationFrame(frameId);
    }, []);

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
                        <path d="M270.65299,391.8073l-86.0389,-0.01116l-53.7026,-34.51702l-118.28993,-0.08201l-0.24857,-205.58319l44.06163,-0.1152l74.41117,55.25762l194.86839,-0.03695h481.49617l70.30745,-55.19783l-0.08481,240.15153l-70.22262,-34.48139l-480.78177,-0.7144z" fill="#7e7e7e" stroke="none" strokeWidth="0" strokeLinecap="butt" />
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
                            <text transform="translate(26.6853,183.66108) scale(0.10407,0.10407)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="Sans Serif" fontWeight="normal" textAnchor="start">
                                <tspan x="0" dy="0">ON/OFF</tspan>
                            </text>
                        </g>

                        <path d="M44.62796,144.35214z" fill="none" stroke="#72bdff" strokeWidth="2" strokeLinecap="butt" />
                        {/* <g fill="none" stroke="#72bdff" strokeWidth="2.5">
                            <path d="M37.90628,168.12837c1.20925,0.97584 1.98274,2.47007 1.98274,4.14498c0,2.94005 -2.38338,5.32345 -5.32343,5.32345c-2.94007,0 -5.32345,-2.38338 -5.32345,-5.32345c0,-1.54676 0.65968,-2.93946 1.71302,-3.91207" strokeLinecap="butt" />
                            <path d="M34.46363,172.85177v-9.44677" strokeLinecap="round" />
                        </g>
                        <text transform="translate(26.6853,183.66108) scale(0.10407,0.10407)" fontSize="40" xmlSpace="preserve" fill="#72bdff" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="Sans Serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">ON/OFF</tspan>
                        </text> */}
                        {/* <!-- DISPLAY (Main Window) --> */}
                        {/* <!-- <path d="M339.34911,339.10312v-91.24327h423.7256v91.24327z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" /> --> */}

                        {/* <!-- CD/DVD Slot  --> */}
                        <path d="M139.6259,193.99169v-30.58669h635.25725v30.58669z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" />

                        {/* Encoder */}
                        <g stroke="#000000" strokeLinecap="butt">
                            <path d="M149.71986,293.48149c0,-42.14111 34.16211,-76.30324 76.30324,-76.30324c42.14111,0 76.30324,34.16211 76.30324,76.30324c0,42.14111 -34.16211,76.30324 -76.30324,76.30324c-42.14111,0 -76.30324,-34.16211 -76.30324,-76.30324z" fill={(outputValues?.powerOn) ? (outputValues?.display?.color1) : (outputValues?.display?.color2)} strokeWidth="0" />
                            <path d="M162.6193,293.48149c0,-35.017 28.38688,-63.40386 63.40386,-63.40386c35.017,0 63.40386,28.38688 63.40386,63.40386c0,35.017 -28.38688,63.40386 -63.40386,63.40386c-35.017,0 -63.40386,-28.38688 -63.40386,-63.40386z" fill="url(#color-1)" strokeWidth="0.5" />
                        </g>

                        <g stroke="none" strokeWidth="0" strokeLinecap="butt">
                            <path d="M836.87248,341.56063c0,-9.97002 8.08231,-18.05235 18.05235,-18.05235c9.97004,0 18.05235,8.08233 18.05235,18.05235c0,9.97002 -8.08231,18.05235 -18.05235,18.05235c-9.97004,0 -18.05235,-8.08233 -18.05235,-18.05235z" fill="#aeaeae" />
                            <path d="M840.35523,341.56063c0,-8.04657 6.52303,-14.56958 14.56958,-14.56958c8.04655,0 14.56958,6.52301 14.56958,14.56958c0,8.04657 -6.52303,14.56958 -14.56958,14.56958c-8.04655,0 -14.56958,-6.52301 -14.56958,-14.56958z" fill="#6c6c6c" />
                            <path d="M843.83799,341.56063c0,-6.12308 4.96373,-11.08681 11.08681,-11.08681c6.12308,0 11.08681,4.96373 11.08681,11.08681c0,6.12308 -4.96373,11.08681 -11.08681,11.08681c-6.12308,0 -11.08681,-4.96373 -11.08681,-11.08681z" fill="#000000" />
                        </g>

                        <text transform="translate(844.04395,369.64661) scale(0.20293,0.20293)" fontSize="40" xmlSpace="preserve" fill="#000000" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="Sans Serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">AV-IN</tspan>
                        </text>
                        <path d="M805.16474,306.83312v-78.42678l7.22347,-8.92462h65.13191l-0.10335,95.71498h-65.37253z" fill="#ffffff" stroke="none" strokeWidth="0" strokeLinecap="butt" />
                        <path d="M812.73223,304.31676v-77.39484h43.34111v77.39484z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" />
                        <text transform="translate(826.1783,312.67515) scale(0.18499,0.18499)" fontSize="40" xmlSpace="preserve" fill="#000000" stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="Sans Serif" fontWeight="normal" textAnchor="start">
                            <tspan x="0" dy="0">USB</tspan>
                        </text>

                        <Display mainData={displayData.main || []} topLeftData={"".split('')} otherIndication={{
                            topLeftDecorationLine: outputValues?.powerOn
                        }} />
                    </g>
                </g>
            </svg>
            {/* <!--rotationCenter:432.627005:125.64786000000001--> */}
        </div>
    )
}