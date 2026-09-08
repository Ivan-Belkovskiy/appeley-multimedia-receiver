'use client';

import { RefObject, useEffect, useRef, useState } from "react";
import "./LCDMonitor.css";

export default function LCDMonitor({ ref, powerOn }: { ref: RefObject<HTMLVideoElement | null>; powerOn?: boolean; }) {


    return (
        <div className={`lcd-monitor power-${powerOn ? 'ON' : 'OFF'}`}>
            
            <video ref={ref} className="lcd-monitor__video"></video>
        </div>
    )
}