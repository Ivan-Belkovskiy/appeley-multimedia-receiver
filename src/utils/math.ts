export const randomInRangeWithMax = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);