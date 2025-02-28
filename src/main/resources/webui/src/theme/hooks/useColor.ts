import { ThemeTypings, useTheme } from "@chakra-ui/react";
import { transparentize } from "color2k";
import delve from "delve";
import { useMemo } from "react";

export function useColor(
  token: ThemeTypings["colors"],
  alpha: number = 1
): string {
  const theme = useTheme();

  return useMemo(() => {
    try {
      const hex = delve(theme, `colors.${token}`);

      if (alpha < 1) {
        return transparentize(hex, 1 - alpha);
      }

      return hex;
    } catch (err) {
      console.error(`[useColor]: `, err);
      return null;
    }
  }, [theme, token, alpha]);
}
