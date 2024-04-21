import { useColorMode, useTheme } from "@chakra-ui/react";
import delve from "delve";
import { SemanticTokens } from "../semanticTokens";

export type ColorTokens = { [key in keyof SemanticTokens["colors"]]: string };

/**
 * Hook permettant de récupérer les valeurs des couleurs contenus dans la propriété semanticTokens du thème
 */
export function useColorTokens(): ColorTokens {
  const theme = useTheme();
  const { colorMode } = useColorMode();

  const tokens = {} as ColorTokens;
  const colors = delve(theme, "semanticTokens.colors");

  for (const color in colors) {
    tokens[color] = delve(
      theme,
      `colors.${
        colorMode === "light" ? colors[color].default : colors[color]._dark
      }`
    );
  }

  return tokens;
}
