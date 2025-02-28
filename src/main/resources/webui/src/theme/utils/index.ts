import { transparentize as setTransparency, toHex } from "color2k";

import delve from "delve";

type Dict = { [key: string]: any };

export const getColor = (theme: Dict, color: string, fallback?: string) => {
  const hex = delve(theme, `colors.${color}`, color);
  try {
    toHex(hex);
    return hex;
  } catch {
    return fallback ?? "#000000";
  }
};

export const transparentize =
  (color: string, opacity: number) => (theme: Dict) => {
    const raw = getColor(theme, color);
    return setTransparency(raw, 1 - opacity);
  };

export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgba(hex: string, alpha: number) {
  const color = hexToRgb(hex);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}
