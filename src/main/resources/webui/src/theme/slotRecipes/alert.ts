import { defineSlotRecipe } from "@chakra-ui/react"
import { alertAnatomy } from "@chakra-ui/react/anatomy"

export const alertSlotRecipe = defineSlotRecipe({
  slots: alertAnatomy.keys(),
  base: {
    root: {
      borderRadius: "xl",
    },
  },
  variants: {
    variant: {
      success: {
        root: {
          bg: "green.50",
        },
        description: {
          color: "green.800",
        },
      },
      warning: {
        root: {
          bg: "yellow.50",
        },
        description: {
          color: "yellow.800",
        },
      },
      info: {
        root: {
          bg: "blue.50",
        },
        description: {
          color: "blue.800",
        },
      },
      error: {
        root: {
          bg: "red.50",
        },
        description: {
          color: "red.800",
        },
      },
    },
  },
})
