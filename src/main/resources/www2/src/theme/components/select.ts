import { selectAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react";
import { transparentize } from "../utils";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(selectAnatomy.keys);
const outlineColor = transparentize("blue.500", 0.16);

/**
 * Permet de surcharger le style du composant "Input"
 */
const outline = definePartsStyle({
  field: {
    borderRadius: "xl",
    border: "1px",
    bg: "white",
    borderColor: "grey.100",
    "&:hover": {
      borderColor: "grey.200",
      bg: "white",
    },
    "&:focus": {
      borderColor: "green.400",
      outline: "3px solid",
      outlineColor,
      bg: "white",
    },
    boxShadow: "initial!important",
    _placeholder: {
      color: "grey.400",
    },
  },
});

const sizes = {
  md: definePartsStyle({
    field: defineStyle({
      height: "40px",
    }),
  }),
};

export const Select = defineMultiStyleConfig({
  sizes,
  variants: {
    outline,
  },
  defaultProps: {
    variant: "outline",
    size: "md",
  },
});
