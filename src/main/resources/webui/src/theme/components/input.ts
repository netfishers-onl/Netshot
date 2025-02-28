import { inputAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react";
import { transparentize } from "../utils";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys);
const outlineColor = transparentize("green.600", 0.1);

/**
 * Permet de surcharger le style du composant "Input"
 */
const outline = definePartsStyle({
  field: {
    borderRadius: "xl",
    border: "1px",
    bg: "white",
    borderColor: "grey.100",
    _hover: {
      borderColor: "grey.200",
    },
    _focus: {
      borderColor: "green.400",
      outline: "3px solid",
      outlineColor,
    },
    _placeholder: {
      opacity: 1,
      color: "grey.400",
    },
    boxShadow: "initial!important",
    _disabled: {
      opacity: 1,
      bg: "grey.100",
      color: "grey.600",
    },
    _readOnly: {
      bg: "grey.100",
      color: "grey.600",
      outline: "0!important",
      borderColor: "grey.100!important",
    },
  },
});

const sizes = {
  md: definePartsStyle({
    field: defineStyle({
      height: "42px",
    }),
  }),
};

export const Input = defineMultiStyleConfig({
  sizes,
  variants: {
    outline,
  },
  defaultProps: {
    variant: "outline",
    size: "md",
  },
});
