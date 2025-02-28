import { checkboxAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react";

/**
 * Permet de surcharger le style de "Checkbox"
 */
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(checkboxAnatomy.keys);

const baseStyle = definePartsStyle({
  control: defineStyle({
    borderRadius: "md",
    mr: 1,
    border: "1px",
    boxSize: "24px",
    borderColor: "grey.100",
    bg: "white",
    boxShadow: "0 2px 4px 0 rgba(202, 207, 226, .16)",
    transition: "all .2s ease",
    _checked: {
      bg: "green.600",
      borderColor: "green.600",
    },
  }),
  icon: defineStyle({
    color: "white",
    _checked: {
      color: "white",
    },
  }),
});

export const Checkbox = defineMultiStyleConfig({
  baseStyle,
});
