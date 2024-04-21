import { progressAnatomy as parts } from "@chakra-ui/anatomy";
import {
  createMultiStyleConfigHelpers,
  defineStyle
} from "@chakra-ui/styled-system";
import { mode } from "@chakra-ui/theme-tools";


/**
 * Permet de surcharger le style du Progress
 */
const { defineMultiStyleConfig, definePartsStyle } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle((props) => ({
  filledTrack: defineStyle({
    bg: "blue.500",
  }),
  track: defineStyle({
    bg: mode("lightGrey.100", "darkGrey.700")(props)
  }),
}));

export const Progress = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    size: "md",
    colorScheme: "blue",
  },
})