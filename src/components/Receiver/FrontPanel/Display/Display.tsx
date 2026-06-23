'use client';

import "./Display.css";
import MainIndicator from "./MainIndicator/MainIndicator";

export interface DisplayOtherIndication {
    topLeftDecorationLine?: boolean;
    Tr?: boolean;
    Elevator?: boolean;
}

export type DisplayMainIndication = {
    directDisplay: true;
    segments: number[];
} | (string | string[]);

export default function Display({
    powerOn,
    mainData,
    topLeftData,
    otherIndication,

    indicationColor1 = "#72bdff",
    indicationColor2 = "#0a1927",

}: {
    powerOn?: boolean;
    mainData: DisplayMainIndication[],
    topLeftData?: DisplayMainIndication[],
    otherIndication?: DisplayOtherIndication,

    indicationColor1?: string,
    indicationColor2?: string,

}) {

    const staticColor = (condition?: boolean) => condition ? indicationColor1 : indicationColor2;

    return (
        // <div className="display">
        //     <svg version="1.1"
        //         xmlns="http://www.w3.org/2000/svg"
        //         xmlnsXlink="http://www.w3.org/1999/xlink" width="423.7256" height="91.24327" viewBox="0,0,423.7256,91.24327">
        //         <g transform="translate(-233.1372,-224.37836)">
        //             <g strokeMiterlimit="10">
        //                 <path d="M233.1372,315.62164v-91.24327h423.7256v91.24327z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" />
        //                 <path d="M361.62163,226.59908l-27.23683,27.23684h-95.26316" fill="none" stroke="#72bdff" strokeWidth="0.5" strokeLinecap="round" />
        //                 {/* <g fill="#395e7e" stroke="none" strokeWidth="0" strokeLinecap="butt">
        //                     <g>
        //                         <path d="M239.88271,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M291.84217,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M265.86243,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M317.8219,310.68636v-40.70158h22.22711v40.70158z" />
        //                     </g>
        //                     <g>
        //                         <path d="M343.80163,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M395.7611,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M369.78136,310.68636v-40.70158h22.2271v40.70158z" />
        //                         <path d="M421.74078,310.68636v-40.70158h22.2271v40.70158z" />
        //                     </g>
        //                     <path d="M447.72056,310.68636v-40.70158h22.2271v40.70158z" />
        //                     <path d="M499.67999,310.68636v-40.70158h22.2271v40.70158z" />
        //                     <path d="M525.65971,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M551.63945,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M577.61922,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M603.59895,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M629.57868,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M473.70024,310.68636v-40.70158h22.22711v40.70158z" />
        //                 </g> */}
        //                 <g fill="#72bdff" stroke="none" strokeLinecap="butt">
        //                     <path d="M239.93805,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //                     <path d="M251.35294,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //                     <path d="M245.6455,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //                     <path d="M257.0604,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //                     <path d="M242.06023,307.81478h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M242.06023,296.9194h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M242.06023,302.36708h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M252.11895,307.77427h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M252.11895,296.87889h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M252.11895,302.32658h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M262.07571,307.81478h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M262.07571,296.9194h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M262.07571,302.36708h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M242.06023,288.65101h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M242.06023,277.75564h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M242.06023,283.20333h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M252.11895,288.61051h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M252.11895,277.71513h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M252.11895,283.16282h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M262.07571,288.65101h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M262.07571,277.75564h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M262.07571,283.20333h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //                     <path d="M256.12232,302.46418l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //                     <path d="M257.3112,299.5671l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //                     <path d="M254.87718,300.41247l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //                     <path d="M253.34784,294.02146l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //                     <path d="M258.84054,305.95811l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //                     <path d="M256.12232,283.09524l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //                     <path d="M257.3112,280.19817l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //                     <path d="M254.87718,281.04355l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //                     <path d="M253.34784,274.65254l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //                     <path d="M258.84054,286.58918l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //                     <path d="M246.07378,302.46418l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //                     <path d="M247.26266,299.5671l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //                     <path d="M244.82864,300.41247l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //                     <path d="M243.2993,294.02146l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //                     <path d="M248.792,305.95811l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //                     <path d="M246.07378,283.09524l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //                     <path d="M247.26266,280.19817l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //                     <path d="M244.82864,281.04355l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //                     <path d="M243.2993,274.65254l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //                     <path d="M248.792,286.58918l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //                     <path d="M239.93805,309.54474v-1.0818h5.06194v2.17752h-2.53014z" strokeWidth="NaN" />
        //                     <path d="M245.6455,310.64047v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //                     <path d="M259.59054,310.64047h-2.53014v-2.17752h5.06194v1.0818z" strokeWidth="NaN" />
        //                     <path d="M251.35295,310.64047v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //                     <path d="M242.4145,269.98478h2.53014v2.17752h-5.06194v-1.0818z" strokeWidth="NaN" />
        //                     <path d="M250.65209,269.98478v2.17752h-5.06194v-2.17752z" strokeWidth="NaN" />
        //                     <path d="M262.06699,271.0805v1.0818h-5.06194v-2.17752h2.53014z" strokeWidth="NaN" />
        //                     <path d="M256.35954,269.98478v2.17752h-5.06194v-2.17752z" strokeWidth="NaN" />
        //                 </g>
        //             </g>
        //         </g>
        //     </svg>
        //     {/* <!--rotationCenter:211.8628:45.621635--> */}
        // </div>


        // <g transform="translate(-233.1372,-224.37836)">
        //     <g strokeMiterlimit="10">
        //         <path d="M233.1372,315.62164v-91.24327h423.7256v91.24327z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" />
        //         <path d="M361.62163,226.59908l-27.23683,27.23684h-95.26316" fill="none" stroke="#72bdff" strokeWidth="0.5" strokeLinecap="round" />
        //         {/* <g fill="#395e7e" stroke="none" strokeWidth="0" strokeLinecap="butt">
        //                     <g>
        //                         <path d="M239.88271,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M291.84217,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M265.86243,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M317.8219,310.68636v-40.70158h22.22711v40.70158z" />
        //                     </g>
        //                     <g>
        //                         <path d="M343.80163,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M395.7611,310.68636v-40.70158h22.22711v40.70158z" />
        //                         <path d="M369.78136,310.68636v-40.70158h22.2271v40.70158z" />
        //                         <path d="M421.74078,310.68636v-40.70158h22.2271v40.70158z" />
        //                     </g>
        //                     <path d="M447.72056,310.68636v-40.70158h22.2271v40.70158z" />
        //                     <path d="M499.67999,310.68636v-40.70158h22.2271v40.70158z" />
        //                     <path d="M525.65971,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M551.63945,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M577.61922,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M603.59895,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M629.57868,310.68636v-40.70158h22.22711v40.70158z" />
        //                     <path d="M473.70024,310.68636v-40.70158h22.22711v40.70158z" />
        //                 </g> */}
        //         <g fill="#72bdff" stroke="none" strokeLinecap="butt">
        //             <path d="M239.93805,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //             <path d="M251.35294,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //             <path d="M245.6455,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //             <path d="M257.0604,291.41767v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //             <path d="M242.06023,307.81478h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M242.06023,296.9194h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M242.06023,302.36708h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M252.11895,307.77427h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M252.11895,296.87889h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M252.11895,302.32658h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M262.07571,307.81478h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M262.07571,296.9194h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M262.07571,302.36708h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M242.06023,288.65101h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M242.06023,277.75564h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M242.06023,283.20333h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M252.11895,288.61051h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M252.11895,277.71513h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M252.11895,283.16282h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M262.07571,288.65101h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M262.07571,277.75564h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M262.07571,283.20333h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
        //             <path d="M256.12232,302.46418l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //             <path d="M257.3112,299.5671l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //             <path d="M254.87718,300.41247l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //             <path d="M253.34784,294.02146l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //             <path d="M258.84054,305.95811l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //             <path d="M256.12232,283.09524l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //             <path d="M257.3112,280.19817l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //             <path d="M254.87718,281.04355l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //             <path d="M253.34784,274.65254l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //             <path d="M258.84054,286.58918l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //             <path d="M246.07378,302.46418l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //             <path d="M247.26266,299.5671l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //             <path d="M244.82864,300.41247l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //             <path d="M243.2993,294.02146l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //             <path d="M248.792,305.95811l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //             <path d="M246.07378,283.09524l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
        //             <path d="M247.26266,280.19817l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
        //             <path d="M244.82864,281.04355l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
        //             <path d="M243.2993,274.65254l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
        //             <path d="M248.792,286.58918l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
        //             <path d="M239.93805,309.54474v-1.0818h5.06194v2.17752h-2.53014z" strokeWidth="NaN" />
        //             <path d="M245.6455,310.64047v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //             <path d="M259.59054,310.64047h-2.53014v-2.17752h5.06194v1.0818z" strokeWidth="NaN" />
        //             <path d="M251.35295,310.64047v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
        //             <path d="M242.4145,269.98478h2.53014v2.17752h-5.06194v-1.0818z" strokeWidth="NaN" />
        //             <path d="M250.65209,269.98478v2.17752h-5.06194v-2.17752z" strokeWidth="NaN" />
        //             <path d="M262.06699,271.0805v1.0818h-5.06194v-2.17752h2.53014z" strokeWidth="NaN" />
        //             <path d="M256.35954,269.98478v2.17752h-5.06194v-2.17752z" strokeWidth="NaN" />
        //         </g>
        //     </g>
        // </g>


        <g className="display" style={{ filter: (powerOn === true) ? 'brightness(1)' : 'brightness(0)', transition: 'all 0.15s ease 0s' }}>
            {/* // <!-- DISPLAY (Main Window) --> */}
            <path d="M339.34911,339.10312v-91.24327h423.7256v91.24327z" fill="#000000" stroke="none" strokeWidth="0" strokeLinecap="butt" />
            {/* // <!-- Display (Top-Left Decoration Line) --> */}
            <path d="M467.83354,250.08056l-27.23683,27.23684h-95.26316" fill="none" stroke={(otherIndication?.topLeftDecorationLine) ? indicationColor1 : indicationColor2} strokeWidth="1" strokeLinecap="round" />

            {/* // <!-- Display (Indicator Places) --> */}
            {/* <g fill="#395e7e" stroke="none" strokeWidth="0" strokeLinecap="butt">
                <g>
                    <path d="M346.09462,334.16784v-40.70158h22.22711v40.70158z" />
                    <path d="M398.05408,334.16784v-40.70158h22.22711v40.70158z" />
                    <path d="M372.07434,334.16784v-40.70158h22.22711v40.70158z" />
                    <path d="M424.03381,334.16784v-40.70158h22.22711v40.70158z" />
                </g>
                <g>
                    <path d="M450.01354,334.16784v-40.70158h22.22711v40.70158z" />
                    <path d="M501.97301,334.16784v-40.70158h22.22711v40.70158z" />
                    <path d="M475.99327,334.16784v-40.70158h22.2271v40.70158z" />
                    <path d="M527.95269,334.16784v-40.70158h22.2271v40.70158z" />
                </g>
                <path d="M553.93247,334.16784v-40.70158h22.2271v40.70158z" />
                <path d="M605.8919,334.16784v-40.70158h22.2271v40.70158z" />
                <path d="M631.87162,334.16784v-40.70158h22.22711v40.70158z" />
                <path d="M657.85136,334.16784v-40.70158h22.22711v40.70158z" />
                <path d="M683.83113,334.16784v-40.70158h22.22711v40.70158z" />
                <path d="M709.81086,334.16784v-40.70158h22.22711v40.70158z" />
                <path d="M735.79059,334.16784v-40.70158h22.22711v40.70158z" />
                <path d="M579.91215,334.16784v-40.70158h22.22711v40.70158z" />
            </g> */}

            {/* // <!-- Display (Main Segment Indicator) --> */}
            {/* // <!-- <g fill="#72bdff" stroke="none" strokeLinecap="butt">
            //     <path d="M346.14996,314.89916v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
            //     <path d="M357.56485,314.89916v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
            //     <path d="M351.85741,314.89916v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
            //     <path d="M363.27231,314.89916v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
            //     <path d="M348.27214,331.29626h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M348.27214,320.40088h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M348.27214,325.84857h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M358.33086,331.25575h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M358.33086,320.36037h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M358.33086,325.80806h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M368.28762,331.29626h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M368.28762,320.40088h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M368.28762,325.84857h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M348.27214,312.1325h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M348.27214,301.23712h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M348.27214,306.68481h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M358.33086,312.09199h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M358.33086,301.19661h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M358.33086,306.6443h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M368.28762,312.1325h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M368.28762,301.23712h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M368.28762,306.68481h-2.17752v-4.83156h2.17752z" strokeWidth="NaN" />
            //     <path d="M362.33423,325.94566l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
            //     <path d="M363.52311,323.04858l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
            //     <path d="M361.08909,323.89396l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
            //     <path d="M359.55975,317.50295l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
            //     <path d="M365.05245,329.43959l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
            //     <path d="M362.33423,306.57673l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
            //     <path d="M363.52311,303.67965l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
            //     <path d="M361.08909,304.52503l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
            //     <path d="M359.55975,298.13402l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
            //     <path d="M365.05245,310.07066l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
            //     <path d="M352.28569,325.94566l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
            //     <path d="M353.47457,323.04858l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
            //     <path d="M351.04055,323.89396l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
            //     <path d="M349.51121,317.50295l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
            //     <path d="M355.00391,329.43959l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
            //     <path d="M352.28569,306.57673l-1.10113,-2.40614l1.10139,-2.42542l1.07613,2.42542z" strokeWidth="NaN" />
            //     <path d="M353.47457,303.67965l-0.93823,-1.80116l1.12098,-5.92881l1.34659,2.18434z" strokeWidth="NaN" />
            //     <path d="M351.04055,304.52503l0.99569,2.03105l-1.17845,5.69892l-1.34659,-2.18434z" strokeWidth="NaN" />
            //     <path d="M349.51121,298.13402l1.34659,-2.18434l1.12098,5.92881l-0.93823,1.80116z" strokeWidth="NaN" />
            //     <path d="M355.00391,310.07066l-1.34659,2.18434l-1.17845,-5.69892l0.99569,-2.03105z" strokeWidth="NaN" />
            //     <path d="M346.14996,333.02623v-1.0818h5.06194v2.17752h-2.53014z" strokeWidth="NaN" />
            //     <path d="M351.85741,334.12195v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
            //     <path d="M365.80245,334.12195h-2.53014v-2.17752h5.06194v1.0818z" strokeWidth="NaN" />
            //     <path d="M357.56486,334.12195v-2.17752h5.06194v2.17752z" strokeWidth="NaN" />
            //     <path d="M348.62641,293.46626h2.53014v2.17752h-5.06194v-1.0818z" strokeWidth="NaN" />
            //     <path d="M356.864,293.46626v2.17752h-5.06194v-2.17752z" strokeWidth="NaN" />
            //     <path d="M368.2789,294.56198v1.0818h-5.06194v-2.17752h2.53014z" strokeWidth="NaN" />
            //     <path d="M362.57145,293.46626v2.17752h-5.06194v-2.17752z" strokeWidth="NaN" />
            // </g> --> */}
            {Array(16).fill(0).map((_, idx) => (
                <MainIndicator
                    offsetX={(26 * idx)}
                    data={mainData?.[idx] || ""}
                    color1={indicationColor1}
                    color2={indicationColor2}
                />
            ))}

            {Array(4).fill(0).map((_, idx) => (
                <MainIndicator
                    offsetX={(160 + (18 * idx))}
                    offsetY={74}
                    scale={0.6}
                    data={topLeftData?.[idx] || ""}
                    color1={indicationColor1}
                    color2={indicationColor2}
                />
            ))}

            {/* <g fill="#8c72ff" stroke="none" stroke-linecap="butt">
                <path d="M365.39072,263.06786v-1.30487h3.03335v1.30487z" stroke-width="NaN" />
                <path d="M372.23105,263.06786v-1.30487h3.03335v1.30487z" stroke-width="NaN" />
                <path d="M368.81089,263.06786v-1.30487h3.03335v1.30487z" stroke-width="NaN" />
                <path d="M375.65123,263.06786v-1.30487h3.03335v1.30487z" stroke-width="NaN" />
                <path d="M366.66243,272.89376h-1.30487v-2.89529h1.30487z" stroke-width="NaN" />
                <path d="M366.66243,266.36475h-1.30487v-2.8953h1.30487z" stroke-width="NaN" />
                <path d="M366.66243,269.62926h-1.30487v-2.89529h1.30487z" stroke-width="NaN" />
                <path d="M372.69008,272.86949h-1.30488v-2.89529h1.30488z" stroke-width="NaN" />
                <path d="M372.69008,266.34047h-1.30488v-2.89529h1.30488z" stroke-width="NaN" />
                <path d="M372.69008,269.60498h-1.30488v-2.8953h1.30488z" stroke-width="NaN" />
                <path d="M378.65663,272.89376h-1.30487v-2.89529h1.30487z" stroke-width="NaN" />
                <path d="M378.65663,266.36475h-1.30487v-2.8953h1.30487z" stroke-width="NaN" />
                <path d="M378.65663,269.62926h-1.30487v-2.89529h1.30487z" stroke-width="NaN" />
                <path d="M366.66243,261.40995h-1.30487v-2.89529h1.30487z" stroke-width="NaN" />
                <path d="M366.66243,254.88093h-1.30487v-2.8953h1.30487z" stroke-width="NaN" />
                <path d="M366.66243,258.14544h-1.30487v-2.8953h1.30487z" stroke-width="NaN" />
                <path d="M372.69008,261.38568h-1.30488v-2.8953h1.30488z" stroke-width="NaN" />
                <path d="M372.69008,254.85666h-1.30488v-2.89529h1.30488z" stroke-width="NaN" />
                <path d="M372.69008,258.12117h-1.30488v-2.8953h1.30488z" stroke-width="NaN" />
                <path d="M378.65663,261.40995h-1.30487v-2.89529h1.30487z" stroke-width="NaN" />
                <path d="M378.65663,254.88093h-1.30487v-2.8953h1.30487z" stroke-width="NaN" />
                <path d="M378.65663,258.14544h-1.30487v-2.8953h1.30487z" stroke-width="NaN" />
                <path d="M375.08909,269.68744l-0.65985,-1.44187l0.66001,-1.45342l0.64486,1.45342z" stroke-width="NaN" />
                <path d="M375.80152,267.95137l-0.56223,-1.07934l0.67174,-3.55282l0.80694,1.30896z" stroke-width="NaN" />
                <path d="M374.34294,268.45796l0.59666,1.2171l-0.70618,3.41506l-0.80694,-1.30896z" stroke-width="NaN" />
                <path d="M373.42649,264.62817l0.80694,-1.30896l0.67174,3.55282l-0.56223,1.07934z" stroke-width="NaN" />
                <path d="M376.71797,271.78116l-0.80694,1.30896l-0.70619,-3.41506l0.59667,-1.2171z" stroke-width="NaN" />
                <path d="M375.08909,258.08068l-0.65985,-1.44187l0.66001,-1.45343l0.64486,1.45343z" stroke-width="NaN" />
                <path d="M375.80152,256.34461l-0.56223,-1.07934l0.67174,-3.55282l0.80694,1.30896z" stroke-width="NaN" />
                <path d="M374.34294,256.8512l0.59666,1.2171l-0.70618,3.41505l-0.80694,-1.30896z" stroke-width="NaN" />
                <path d="M373.42649,253.02141l0.80694,-1.30896l0.67174,3.55282l-0.56223,1.07934z" stroke-width="NaN" />
                <path d="M376.71797,260.1744l-0.80694,1.30896l-0.70619,-3.41505l0.59667,-1.2171z" stroke-width="NaN" />
                <path d="M369.06753,269.68744l-0.65984,-1.44187l0.66,-1.45342l0.64487,1.45342z" stroke-width="NaN" />
                <path d="M369.77997,267.95137l-0.56223,-1.07934l0.67174,-3.55282l0.80694,1.30896z" stroke-width="NaN" />
                <path d="M368.32139,268.45796l0.59666,1.2171l-0.70619,3.41506l-0.80694,-1.30896z" stroke-width="NaN" />
                <path d="M367.40494,264.62817l0.80694,-1.30896l0.67174,3.55282l-0.56223,1.07934z" stroke-width="NaN" />
                <path d="M370.69642,271.78116l-0.80694,1.30896l-0.70618,-3.41506l0.59666,-1.2171z" stroke-width="NaN" />
                <path d="M369.06753,258.08068l-0.65984,-1.44187l0.66,-1.45343l0.64487,1.45343z" stroke-width="NaN" />
                <path d="M369.77997,256.34461l-0.56223,-1.07934l0.67174,-3.55282l0.80694,1.30896z" stroke-width="NaN" />
                <path d="M368.32139,256.8512l0.59666,1.2171l-0.70619,3.41505l-0.80694,-1.30896z" stroke-width="NaN" />
                <path d="M367.40494,253.02141l0.80694,-1.30896l0.67174,3.55282l-0.56223,1.07934z" stroke-width="NaN" />
                <path d="M370.69642,260.1744l-0.80694,1.30896l-0.70618,-3.41505l0.59666,-1.2171z" stroke-width="NaN" />
                <path d="M365.39072,273.93045v-0.64827h3.03335v1.30487h-1.51617z" stroke-width="NaN" />
                <path d="M368.81089,274.58705v-1.30487h3.03335v1.30487z" stroke-width="NaN" />
                <path d="M377.16741,274.58705h-1.51618v-1.30487h3.03335v0.64827z" stroke-width="NaN" />
                <path d="M372.23106,274.58705v-1.30487h3.03335v1.30487z" stroke-width="NaN" />
                <path d="M366.87472,250.22427h1.51618v1.30487h-3.03335v-0.64827z" stroke-width="NaN" />
                <path d="M371.81107,250.22427v1.30487h-3.03335v-1.30487z" stroke-width="NaN" />
                <path d="M378.65141,250.88088v0.64827h-3.03335v-1.30487h1.51618z" stroke-width="NaN" />
                <path d="M375.23124,250.22427v1.30487h-3.03335v-1.30487z" stroke-width="NaN" />
            </g> */}

            <text transform="translate(355.05362,256.1348) scale(0.19262,0.19262)" fontSize="40" xmlSpace="preserve" fill={otherIndication?.Tr ? indicationColor1 : indicationColor2} stroke="none" strokeWidth="1" strokeLinecap="butt" fontFamily="sans-serif" fontWeight="normal" textAnchor="start">
                <tspan x="0" dy="0">Tr</tspan>
            </text>
            <g strokeLinecap="butt">
                <path d="M352.52226,274.30375v-15.94654h9.63043v15.94654z" fill="none" stroke={staticColor(otherIndication?.Elevator)} strokeWidth="0.5" />
                <g fill={staticColor(otherIndication?.Elevator)}>
                    <path d="M353.97791,264.03528l1.49867,-3.35957l1.48761,3.35957z" stroke={staticColor(otherIndication?.Elevator)} strokeWidth="0.8" />
                    <path d="M354.90044,272.57392v-8.58556h1.09326v8.58556z" stroke={staticColor(otherIndication?.Elevator)} strokeWidth="0" />
                </g>
                <g fill={staticColor(otherIndication?.Elevator)}>
                    <path d="M360.69704,268.83896l-1.48761,3.35957l-1.49867,-3.35957z" stroke={staticColor(otherIndication?.Elevator)} strokeWidth="0.8" />
                    <path d="M359.72656,260.30032v8.58556h-1.09326v-8.58556z" stroke={staticColor(otherIndication?.Elevator)} strokeWidth="0" />
                </g>
            </g>
            {/* <MainIndicator data={data?.[0]} />
            <MainIndicator offset={((26) * 1)} data={data?.[1]} /> */}
        </g>
    )
}