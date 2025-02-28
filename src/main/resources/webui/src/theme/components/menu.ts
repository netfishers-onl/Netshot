import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(menuAnatomy.keys);

const baseStyle = definePartsStyle({
  button: {},
  list: {
    borderRadius: "2xl",
    p: 2,
    border: "none",
    boxShadow: "0 2px 10px 0 rgba(140, 149, 159, .16)",
    zIndex: "2",
  },
  item: {
    fontSize: "md",
    height: "42px",
    borderRadius: "lg",
    transition: "all .2s ease",
    bg: "white",
    _hover: {
      bg: "green.50",
      color: "green.800",
    },
    _focus: {
      bg: "green.50",
      color: "green.800",
    },
  },
  groupTitle: {},
  command: {},
  divider: {},
});

export const Menu = defineMultiStyleConfig({ baseStyle });
