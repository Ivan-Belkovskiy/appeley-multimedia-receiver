'use client';

import { useRef, useState } from "react";
import AppeleyReceiver from "../Receiver/Receiver";
import { InternetRadioStation } from "@/app/actions";

export default function HomePage({ internetRadioStations }: {
    internetRadioStations: InternetRadioStation[];
}) {
    const monitorRef = useRef<HTMLVideoElement | null>(null);
    const [videoOn, setVideoOn] = useState<boolean | undefined>(false);
    return (
        <div className="page-container">
            <h1 className="page-title">APPELEY Multimedia Receiver</h1>
            <AppeleyReceiver internetRadioStations={internetRadioStations} videoOutputRef={monitorRef} setVideoPowerOn={setVideoOn} />
            {/* <LCDMonitor ref={monitorRef} powerOn={videoOn} /> */}
        </div>
    );
}