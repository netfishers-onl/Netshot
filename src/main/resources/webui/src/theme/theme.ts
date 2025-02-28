import {
  extendTheme,
  withDefaultColorScheme,
  type ThemeConfig,
  type ThemeOverride,
} from "@chakra-ui/react";
import borderRadius from "./borderRadius";
import colors from "./colors";
import components from "./components";
import semanticTokens from "./semanticTokens";
import sizes from "./sizes";
import { spacing } from "./spacing";
import typography from "./typography";

/**
 * @note https://chakra-ui.com/docs/styled-system/theme
 */
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

export const theme: ThemeOverride = extendTheme(
  withDefaultColorScheme({ colorScheme: "green" }),
  {
    config,
    sizes,
    space: spacing,
    ...borderRadius,
    components,
    ...typography,
    colors,
    styles: {
      global: {
        html: {
          fontSize: "14px",
          letterSpacing: "-0.14px",
        },
        ":not(.chakra-dont-set-collapse) > .chakra-collapse": {
          overflow: "initial !important",
        },
        body: {
          bg: {
            default: "white",
          },
        },
      },
    },
    semanticTokens,
  }
);
