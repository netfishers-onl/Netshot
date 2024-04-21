import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import {
  createMultiStyleConfigHelpers,
  defineStyle,
} from "@chakra-ui/styled-system";
import { transparentize } from "../utils";

/**
 * Permet de surcharger le style du composant "Modal"
 * https://chakra-ui.com/docs/components/modal/theming
 */
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys);

const overlayColor = transparentize("green.1100", 0.5);

const baseStyle = definePartsStyle({
  overlay: defineStyle({
    background: overlayColor,
    backdropFilter: "blur(14px)",
  }),
  dialog: defineStyle({
    pb: "0!important",
    borderRadius: "3xl",
    bg: "white",
  }),
  header: defineStyle({
    px: 7,
    pt: 7,
    pb: 7,
  }),
  body: defineStyle({
    px: 7,
  }),
  footer: defineStyle({
    px: 7,
    pb: 7,
  }),
  closeButton: defineStyle({
    top: 7,
    right: 7,
    border: "1px",
    color: "black",
    borderColor: "grey.100",
    boxShadow: "0 2px 4px 0 rgba(202, 207, 226, .16)",
    _hover: {
      bg: "grey.50",
    },
    _active: {
      bg: "white",
    },
  }),
});

export const Modal = defineMultiStyleConfig({
  baseStyle,
  variants: {
    floating: definePartsStyle({
      dialogContainer: defineStyle({
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "20px",
        pointerEvents: "none",
      }),
      dialog: defineStyle({
        pointerEvents: "auto",
        m: 0,
        height: "100%",
        borderRadius: "3xl",
        maxHeight: "initial",
      }),
      body: defineStyle({
        p: 0,
        overflow: "auto",
      }),
    }),
    "full-floating": definePartsStyle({
      dialogContainer: defineStyle({
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }),
      dialog: defineStyle({
        m: 0,
        width: "100%",
        height: "100%",
        borderRadius: "3xl",
        maxHeight: "initial",
        maxWidth: "initial",
      }),
      body: defineStyle({
        display: "flex",
        flexDirection: "column",
      }),
    }),
  },
});
