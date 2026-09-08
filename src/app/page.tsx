'use client';
import LCDMonitor from "@/components/LCDMonitor/LCDMonitor";
import "./page.css";
import AppeleyReceiver from "@/components/Receiver/Receiver";
import Image from "next/image";
import { useRef, useState } from "react";


export default function Home() {
  const monitorRef = useRef<HTMLVideoElement | null>(null);
  const [videoOn, setVideoOn] = useState<boolean | undefined>(false);
  return (
    <div className="page-container">
      <AppeleyReceiver videoOutputRef={monitorRef} setVideoPowerOn={setVideoOn} />
      <LCDMonitor ref={monitorRef} powerOn={videoOn} />
    </div>
  );
}
