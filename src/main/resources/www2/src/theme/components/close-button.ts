import { defineStyle, defineStyleConfig, StyleFunctionProps } from '@chakra-ui/react';

/**
 * @note Permet de surcharger le composant CloseButton
 */
const defaultStyle = defineStyle((props: StyleFunctionProps) => ({
  borderRadius: "xl",
  border: "1px",
  bg: props.colorMode === "dark" ? "darkGrey.800" : "white",
  borderColor: props.colorMode === "dark" ? "darkGrey.700" : "lightGrey.200",
  color: "text.default",
  _hover: {
    bg: "darkGrey.700",
    borderColor: "darkGrey.600",
  },
  _active: {
    bg: "darkGrey.600",
    borderColor: "darkGrey.700",
  },
  _disabled: {
    bg: "darkGrey.700!important",
    color: "darkGrey.50"
  }
}));

export const CloseButton = defineStyleConfig({
  sizes: {
    sm: {
      width: "32px",
      height: "32px"
    }
  },
  variants: {
    default: defaultStyle,
  }, defaultProps: {
    variant: "default",
    size: "sm"
  }
});