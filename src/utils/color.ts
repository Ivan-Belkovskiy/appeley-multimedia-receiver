const hexToRgb = (hex: string) => {
  hex = hex.replace('#', '');
  if (hex.length !== 6) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHsl = ({ r, g, b }: { r: number, g: number, b: number }) => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l }; 

  const d = max - min;
  let s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60; break;
    case gNorm: h = ((bNorm - rNorm) / d + 2) * 60; break;
    case bNorm: h = ((rNorm - gNorm) / d + 4) * 60; break;
  }

  return { h, s, l };
};

const hslToRgb = ({ h, s, l }: { h: number, s: number, l: number}) => {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    [r, g, b] = [chroma, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, chroma, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, chroma, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, chroma];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, chroma];
  } else {
    [r, g, b] = [chroma, 0, x];
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
};

const padHex = (num: number) => num.toString(16).padStart(2, '0');

export const brightnessFilter = (hexColor: string, magnitude: number) => {
  hexColor = hexColor.replace('#', '');
  if (hexColor.length !== 6) return hexColor;

  const rgb = hexToRgb('#' + hexColor);
  if (!rgb) return hexColor;

  const hsl = rgbToHsl(rgb);
  let newL = hsl.l + magnitude;
  if (newL > 1) newL = 1;
  if (newL < 0) newL = 0;

  const newRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: newL });
  return `#${padHex(newRgb.r)}${padHex(newRgb.g)}${padHex(newRgb.b)}`;
};


export const applyColorOffset = (hexColor: string, offset: number) => {
  
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const hsl = rgbToHsl(rgb);

  let newH = (hsl.h + offset * 360) % 360;
  if (newH < 0) newH += 360;

  const newRgb = hslToRgb({ h: newH, s: hsl.s, l: hsl.l });
  return `#${padHex(newRgb.r)}${padHex(newRgb.g)}${padHex(newRgb.b)}`;
};





export const setBrightness = (hexColor: string, targetLightness: number) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const hsl = rgbToHsl(rgb);
  const l = Math.max(0, Math.min(1, targetLightness));

  const newRgb = hslToRgb({ h: hsl.h, s: hsl.s, l });
  return `#${padHex(newRgb.r)}${padHex(newRgb.g)}${padHex(newRgb.b)}`;
};



const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};


export const normalizeLuminance = (hexColor: string, targetLuminance: number) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  const lum = relativeLuminance(rgb);
  if (lum === 0) return hexColor; 

  const target = Math.max(0, Math.min(1, targetLuminance));
  const scale = target / lum;

  return `#${padHex(Math.min(255, Math.round(rgb.r * scale)))}${padHex(
    Math.min(255, Math.round(rgb.g * scale))
  )}${padHex(Math.min(255, Math.round(rgb.b * scale)))}`;
};