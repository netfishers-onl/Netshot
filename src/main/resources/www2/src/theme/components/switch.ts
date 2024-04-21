import { switchAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(switchAnatomy.keys);

const baseStyle = definePartsStyle({
  thumb: {
    bg: "white",
  },
  track: {
    bg: "grey.300",
    _checked: {
      bg: "green.600",
    },
  },
});

export const Switch = defineMultiStyleConfig({
  baseStyle,
  sizes: {
    md: definePartsStyle({
      container: {
        "--switch-track-height": "18px",
        "--switch-track-width": "38px",
      },
      track: {
        p: 1,
      },
    }),
  },
  defaultProps: {
    size: "md",
  },
});
