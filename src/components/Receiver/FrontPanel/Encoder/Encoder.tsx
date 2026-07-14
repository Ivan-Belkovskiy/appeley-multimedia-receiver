'use client';

import { MouseEvent, MouseEventHandler, useEffect, useState } from "react";

export default function Encoder({
    indicationColor,
    onButtonClick,
    onButtonUp,
    onScrollLeft,
    onScrollRight
}: {
    indicationColor?: string;
    onButtonClick: () => void;
    onButtonUp: () => void;
    onScrollLeft: () => void;
    onScrollRight: () => void;
}) {

    // Храним состояние нажатия и последние координаты мыши
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [lastX, setLastX] = useState<number | null>(null);

    const onMouseMove: MouseEventHandler = (e: MouseEvent) => {
        if (!isDragging) return;

        const currentX = e.clientX;

        const deltaX = currentX - (lastX ?? currentX);
        if (Math.abs(deltaX) > 12) {
            if (deltaX > 0) {
                onScrollRight();
            } else {
                onScrollLeft();
            }
            
            setLastX(currentX);
        }
        
        if (lastX === null) setLastX(currentX);
    };

    return (
        <g
            className="encoder"
            stroke="#000000"
            strokeLinecap="butt"
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={onMouseMove}
            onMouseUp={() => {
                setIsDragging(false);
                setLastX(null);
                onButtonUp();
            }}
            onMouseLeave={() => {
                setIsDragging(false);
                setLastX(null);
                onButtonUp();
            }}
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
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onButtonClick();
                }}
                onMouseUp={(e) => {
                    // e.stopPropagation();
                    onButtonUp();
                }}
                onMouseLeave={(e) => {
                    e.stopPropagation();
                    onButtonUp();
                }}
            />
        </g>
    );
}
