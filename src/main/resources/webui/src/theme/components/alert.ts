import { alertAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react";

/**
 * Permet de surcharger le composant Alert
 */
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(alertAnatomy.keys);

export const Alert = defineMultiStyleConfig({
  baseStyle: definePartsStyle({
    container: defineStyle({
      borderRadius: "xl",
    }),
  }),
  variants: {
    success: definePartsStyle({
      container: defineStyle({
        bg: "green.50",
      }),
      description: defineStyle({
        color: "green.800",
      }),
    }),
    warning: definePartsStyle({
      container: defineStyle({
        bg: "yellow.50",
      }),
      description: defineStyle({
        color: "yellow.800",
      }),
    }),
    info: definePartsStyle({
      container: defineStyle({
        bg: "blue.50",
      }),
      description: defineStyle({
        color: "blue.800",
      }),
    }),
    error: definePartsStyle({
      container: defineStyle({
        bg: "red.50",
      }),
      description: defineStyle({
        color: "red.800",
      }),
    }),
  },
});
