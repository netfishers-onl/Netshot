import { useColorMode, useTheme } from "@chakra-ui/react";
import { transparentize } from "color2k";
import delve from "delve";
import { SemanticTokens } from "../semanticTokens";

/**
 * Hook permettant de récupérer la valuer d'un token fourni par le thème (semanticTokens)
 */
export function useColorToken(
  token: keyof SemanticTokens["colors"],
  alpha: number = 1
) {
  const theme = useTheme();
  const { colorMode } = useColorMode();
  const path = `semanticTokens.colors.${token}`;

  try {
    const token = delve(
      theme,
      `${path}.${colorMode === "light" ? "default" : "_dark"}`
    );

    const hex = delve(theme, `colors.${token}`);

    if (alpha < 1) {
      return transparentize(hex, 1 - alpha);
    }

    return hex;
  } catch (err) {
    console.error(`[useColorToken]: `, err);
    return null;
  }
}
