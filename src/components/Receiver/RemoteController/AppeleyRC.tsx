'use client';

import { RefObject } from "react";
import { MainControllerInputButtons, MainControllerInputs } from "../MainController/MainController";
import "./AppeleyRC.css";

export default function AppeleyRC({
    mainControllerInputsRef
}: {
    mainControllerInputsRef: RefObject<MainControllerInputs>;
}) {

    const controllerInputs = mainControllerInputsRef.current;

    const buttonHandlers = (
        name: keyof MainControllerInputButtons,
        encoderAction?: "button" | "left" | "right",
        onActivate?: () => void,
        onDeactivate?: () => void,
    ) => ({

        onPointerDown: (e: React.PointerEvent) => {
            (e.currentTarget as Element).setPointerCapture(e.pointerId);

            e.preventDefault();

            if (name === 'encoder' && encoderAction) {
                controllerInputs.buttons = {
                    ...controllerInputs.buttons, [name]: {
                        ...controllerInputs.buttons?.[name],
                        [encoderAction]: true
                    }
                };
            } else {
                controllerInputs.buttons = { ...controllerInputs.buttons, [name]: true };
            }
            onActivate?.();
        },
        onPointerUp: (e: React.PointerEvent) => {
            try {
                (e.currentTarget as Element).releasePointerCapture(e.pointerId);
            } catch { }
            if (name === 'encoder' && encoderAction) {
                controllerInputs.buttons = {
                    ...controllerInputs.buttons, [name]: {
                        ...controllerInputs.buttons?.[name],
                        [encoderAction]: false
                    }
                };
            } else {
                controllerInputs.buttons = { ...controllerInputs.buttons, [name]: false };
            }
            onDeactivate?.();
        },
        onPointerCancel: () => {
            if (name === 'encoder' && encoderAction) {
                controllerInputs.buttons = {
                    ...controllerInputs.buttons, [name]: {
                        ...controllerInputs.buttons?.[name],
                        [encoderAction]: false
                    }
                };
            } else {
                controllerInputs.buttons = { ...controllerInputs.buttons, [name]: false };
            }
            onDeactivate?.();
        },
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    });

    return (
        <div className="appeley-rc">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="208.282"
                height="374.018"
                viewBox="0 0 208.282 374.018"
            >
                <g strokeMiterlimit="10">
                    {/* Background */}
                    <path
                        fill="#cdcfcf"
                        stroke="#6f97a7"
                        strokeWidth="9"
                        d="M4.5 316.926V57.01L38.64 4.5h131.046l34.096 52.4v260.026l-34.096 52.592H38.496z"
                    ></path>
                    <path
                        fill="#aac6d1"
                        stroke="#4a6570"
                        strokeWidth="2.5"
                        d="m51.37 232.489 52.528-52.528 52.528 52.528-52.528 52.528z"
                    ></path>

                    <path fill="#7e7e7e" d="M41.91 248.511h-.5z"></path>

                    {/* APPELEY Logo */}
                    <g fill="#4a6570" strokeWidth="0">
                        <path d="M51.02 46.217V26.405h3.126v19.812z"></path>
                        <path d="M61.016 29.565h-7.312v-3.16h7.312zM61.016 37.715h-7.312v-3.16h7.312z"></path>
                        <path d="M60.59 46.217V26.405h3.094v19.812zM66.828 46.217V26.405h3.127v19.812z"></path>
                        <path d="M76.776 29.565h-7.312v-3.16h7.312zM76.776 37.715h-7.312v-3.16h7.312z"></path>
                        <path d="M76.122 37.715v-11.31h3.224v11.31zM82.392 46.217V26.405h3.127v19.812z"></path>
                        <path d="M92.34 29.565h-7.312v-3.16h7.312zM92.34 37.715h-7.312v-3.16h7.312z"></path>
                        <path d="M91.685 37.715v-11.31h3.225v11.31zM113.764 46.217V26.405h3.126v19.812z"></path>
                        <path d="M126.282 46.217h-9.883v-3.16h9.883zM98.178 46.217V26.405h3.127v19.812z"></path>
                        <path d="M110.696 29.565h-9.882v-3.16h9.882zM110.696 37.715h-9.882v-3.16h9.882zM110.696 46.217h-9.882v-3.16h9.882zM129.54 46.217V26.405h3.126v19.812z"></path>
                        <path d="M142.057 29.565h-9.882v-3.16h9.882zM142.057 37.715h-9.882v-3.16h9.882zM142.057 46.217h-9.882v-3.16h9.882zM144.745 37.715v-11.31h3.126v11.31zM154.121 46.217V26.405h3.127v19.812z"></path>
                        <path d="M157.263 37.715h-9.883v-3.16h9.883zM157.263 46.217h-12.518v-3.16h12.518z"></path>
                    </g>

                    <text
                        xmlSpace="preserve"
                        fill="#4a6570"
                        stroke="#4a6570"
                        strokeWidth="0"
                        fontFamily="sans-serif"
                        fontSize="40"
                        transform="matrix(.33313 0 -.03285 .33313 41.789 322.94)"
                    >
                        <tspan x="0" dy="0">
                            APPELEY AP-037-RC
                        </tspan>
                    </text>

                    <text
                        xmlSpace="preserve"
                        fill="#4a6570"
                        fontFamily="sans-serif"
                        fontSize="40"
                        transform="translate(51.019 345.376)scale(.30224)"
                    >
                        <tspan x="0" dy="0">
                            Remote Controller
                        </tspan>
                    </text>


                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('nextTrack')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="M156.34 241.248h-23.66v-23.096h23.66l6.343 11.337z"
                        ></path>
                        <g fill="#4a6570" strokeWidth="0">
                            <path d="M145.332 226.804v-5.309l6.701 2.73z"></path>
                            <path d="M140.578 226.804v-5.309l6.701 2.73z"></path>
                        </g>
                        <path
                            fill="none"
                            stroke="#4a6570"
                            strokeLinecap="round"
                            d="M135.847 229.773h20.917M142.925 236.85l2.958-4.542 3.17 4.437"
                        ></path>
                    </g>

                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('prevTrack')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="m44.706 229.49 6.341-11.338H74.71v23.096H51.047z"
                        ></path>
                        <path fill="#4a6570" d="m55.355 224.225 6.701-2.73v5.309z"></path>
                        <path fill="#4a6570" d="m60.11 224.225 6.7-2.73v5.309z"></path>
                        <path
                            fill="none"
                            stroke="#4a6570"
                            strokeLinecap="round"
                            d="M71.541 229.773H50.624M64.463 232.308l-2.958 4.543-3.17-4.437"
                        ></path>
                    </g>

                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('nextFolder')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="M115.689 179.84v23.662H92.593V179.84l11.337-6.342z"
                        ></path>
                        <g fill="#4a6570">
                            <path d="m107.59 185.643 3.884 7.5h-7.552z"></path>
                            <text
                                xmlSpace="preserve"
                                fontFamily="sans-serif"
                                fontSize="40"
                                transform="translate(96.807 193.376)scale(.28411)"
                            >
                                <tspan x="0" dy="0">
                                    F
                                </tspan>
                            </text>
                        </g>
                    </g>


                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('prevFolder')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="m103.93 292.39-11.337-6.341v-23.662h23.096v23.662z"
                        ></path>
                        <g fill="#4a6570">
                            <path d="M103.922 271.336h7.552l-3.884 7.5z"></path>
                            <text
                                xmlSpace="preserve"
                                fontFamily="sans-serif"
                                fontSize="40"
                                transform="translate(96.807 279.069)scale(.28411)"
                            >
                                <tspan x="0" dy="0">
                                    F
                                </tspan>
                            </text>
                        </g>
                    </g>

                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('powerOnOff')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="m21.82 100.547 9.911-23.046h72.311L94.1 100.597z"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(60.391 95.152)scale(.15447)"
                        >
                            <tspan x="0" dy="0">
                                ON/OFF
                            </tspan>
                        </text>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(59.462 87.613)scale(.178)"
                        >
                            <tspan x="0" dy="0">
                                POWER
                            </tspan>
                        </text>
                        <g fill="none" stroke="#4a6570" strokeWidth="2">
                            <path d="M51.888 86.624a5.442 5.442 0 1 1-7.106.238"></path>
                            <path strokeLinecap="round" d="M48.369 81.795v9.657"></path>
                        </g>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('srcSelect')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="m177.948 77.55 12.734 23.047h-86.184l9.684-23.096z"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(122.357 92.926)scale(.30224)"
                        >
                            <tspan x="0" dy="0">
                                SOURCE
                            </tspan>
                        </text>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('back')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="M113.693 131.256h20.539l9.88 19.22h-36.356l-7.76-23.52z"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(108.92 143.775)scale(.23479)"
                        >
                            <tspan x="0" dy="0">
                                BACK
                            </tspan>
                        </text>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('disp')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="M138.623 130.997h21.974l23.972-4.299-10.288 23.519h-25.779z"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(150.973 143.516)scale(.23479)"
                        >
                            <tspan x="0" dy="0">
                                DISP
                            </tspan>
                        </text>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('menu')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2.5"
                            d="M99.996 121.907v-15.835h91.216l-6.215 15.835-24.4 4.3h-46.904z"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(123.103 118.956)scale(.23479)"
                        >
                            <tspan x="0" dy="0">
                                MENU
                            </tspan>
                        </text>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('encoder', 'right')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2"
                            d="m49.363 124.6-6.75-18.16h49.916l-.007 18.197z"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(49.048 114.167)scale(.16997)"
                        >
                            <tspan x="0" dy="0">
                                VOLUME +
                            </tspan>
                        </text>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(53.548 121.851)scale(.15467)"
                        >
                            <tspan x="0" dy="0">
                                SCROLL
                            </tspan>
                        </text>
                        <path fill="#4a6570" d="M80.082 122.135v-4.83l6.826 2.484z"></path>
                        <path
                            fill="none"
                            stroke="#4a6570"
                            strokeLinecap="round"
                            strokeWidth="0.5"
                            d="M49.1 115.916h39.153"
                        ></path>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('encoder', 'left')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2"
                            d="m92.522 128.259.007 18.197H42.612l6.75-18.16z"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(51.298 135.986)scale(.16997)"
                        >
                            <tspan x="0" dy="0">
                                VOLUME -
                            </tspan>
                        </text>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(51.448 143.67)scale(.15467)"
                        >
                            <tspan x="0" dy="0">
                                SCROLL
                            </tspan>
                        </text>
                        <path fill="#4a6570" d="m77.982 141.608 6.826-2.484v4.83z"></path>
                        <path
                            fill="none"
                            stroke="#4a6570"
                            strokeLinecap="round"
                            strokeWidth="0.5"
                            d="M49.1 137.736h39.153"
                        ></path>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('eject')}
                    >
                        <path
                            fill="#aac6d1"
                            stroke="#4a6570"
                            strokeWidth="2"
                            d="M20.75 145.963v-39.115h15.734l7.318 19.633-7.318 19.482z"
                        ></path>
                        <g fill="#4a6570" strokeWidth="0">
                            <path d="m25.732 122.643 4.61-6.535 4.908 6.535zM25.732 125.413v-1.69h9.518v1.69z"></path>
                        </g>
                        <text
                            xmlSpace="preserve"
                            fill="#4a6570"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(23.96 132.696)scale(.12278)"
                        >
                            <tspan x="0" dy="0">
                                EJECT
                            </tspan>
                        </text>
                    </g>
                    <g
                        className="appeley-rc__button"
                        {...buttonHandlers('encoder', 'button')}
                    >
                        <path
                            fill="#0497d1"
                            stroke="#002160"
                            strokeWidth="2.5"
                            d="M80.73 232.489c0-12.796 10.373-23.169 23.168-23.169s23.17 10.373 23.17 23.169-10.374 23.169-23.17 23.169c-12.795 0-23.168-10.373-23.168-23.169z"
                        ></path>
                        <path
                            fill="none"
                            stroke="#002160"
                            strokeLinecap="round"
                            strokeWidth="2.5"
                            d="M88.897 232.489H118.9"
                        ></path>
                        <text
                            xmlSpace="preserve"
                            fill="#002160"
                            fontFamily="sans-serif"
                            fontSize="40"
                            transform="translate(90.105 225.464)scale(.20665)"
                        >
                            <tspan x="0" dy="0">
                                SELECT
                            </tspan>
                        </text>
                        <path fill="#002160" d="M93.467 245.206v-7.5l7.501 3.857z"></path>
                        <path
                            fill="none"
                            stroke="#002160"
                            strokeLinecap="round"
                            d="m102.307 246.685 2.493-9.85"
                        ></path>
                        <g fill="#002160" strokeWidth="0">
                            <path d="M107.58 245.194v-7.421h2.447v7.421zM111.132 245.194v-7.421h2.448v7.421z"></path>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    )
}