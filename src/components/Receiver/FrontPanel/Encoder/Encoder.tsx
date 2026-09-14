'use client';

import { PointerEvent, useRef } from "react";

export default function Encoder({
    indicationColor,
    onButtonClick,
    onButtonUp,
    onScrollLeft,
    onScrollRight,
}: {
    indicationColor?: string;
    onButtonClick: () => void;
    onButtonUp: () => void;
    onScrollLeft: () => void;
    onScrollRight: () => void;
}) {
    const isDraggingRef = useRef(false);
    const lastXRef = useRef<number | null>(null);
    const accumulatedRef = useRef(0);      
    const pointerIdRef = useRef<number | null>(null);

    const STEP = 15;

    const handlePointerDown = (e: PointerEvent<SVGGElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        isDraggingRef.current = true;
        lastXRef.current = e.clientX;
        accumulatedRef.current = 0;
        pointerIdRef.current = e.pointerId;

        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent<SVGGElement>) => {
        if (!isDraggingRef.current) return;
        if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

        const lastX = lastXRef.current;
        if (lastX === null) {
            lastXRef.current = e.clientX;
            return;
        }

        const deltaX = e.clientX - lastX;
        lastXRef.current = e.clientX;
        accumulatedRef.current += deltaX;

        while (Math.abs(accumulatedRef.current) >= STEP) {
            if (accumulatedRef.current > 0) onScrollRight();
            else onScrollLeft();

            accumulatedRef.current -= Math.sign(accumulatedRef.current) * STEP;
        }
    };

    const handlePointerUp = (e: PointerEvent<SVGGElement>) => {
        if (!isDraggingRef.current) return;

        isDraggingRef.current = false;
        lastXRef.current = null;
        accumulatedRef.current = 0;

        if (pointerIdRef.current !== null) {
            try {
                e.currentTarget.releasePointerCapture(pointerIdRef.current);
            } catch { }
            pointerIdRef.current = null;
        }

        onButtonUp();
    };

    const handleButtonPointerDown = (e: PointerEvent<SVGCircleElement>) => {
        e.stopPropagation();   
        onButtonClick();
    };

    return (
        <g
            className="encoder"
            stroke="#000000"
            strokeLinecap="butt"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <path
                d="M149.71986,293.48149c0,-42.14111 34.16211,-76.30324 76.30324,-76.30324c42.14111,0 76.30324,34.16211 76.30324,76.30324c0,42.14111 -34.16211,76.30324 -76.30324,76.30324c-42.14111,0 -76.30324,-34.16211 -76.30324,-76.30324z"
                fill={indicationColor}
                strokeWidth="0"
            />

            <path
                d="M162.6193,293.48149c0,-35.017 28.38688,-63.40386 63.40386,-63.40386c35.017,0 63.40386,28.38688 63.40386,63.40386c0,35.017 -28.38688,63.40386 -63.40386,63.40386c-35.017,0 -63.40386,-28.38688 -63.40386,-63.40386z"
                fill="url(#color-1)"
                strokeWidth="0.5"
                onPointerDown={handleButtonPointerDown}
                onPointerUp={(e) => {
                    e.stopPropagation();
                    onButtonUp();
                }}
                onPointerCancel={(e) => {
                    e.stopPropagation();
                    onButtonUp();
                }}
            />
        </g>
    );
}