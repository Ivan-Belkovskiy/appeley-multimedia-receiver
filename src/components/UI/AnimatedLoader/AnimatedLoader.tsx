'use client';

import { CSSProperties } from "react";
import "./AnimatedLoader.css";

export default function AnimatedLoader({ styles }: {  styles?: CSSProperties}) {
    return (
        <span className="animated-loader" style={styles}></span>
    )
}