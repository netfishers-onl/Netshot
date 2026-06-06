import { defineSlotRecipe } from "@chakra-ui/react"
import { radioCardAnatomy } from "@chakra-ui/react/anatomy"

export const radioCardSlotRecipe = defineSlotRecipe({
  slots: radioCardAnatomy.keys(),
  base: {
    root: {
      colorPalette: "green",
    },
    item: {
      borderRadius: "xl",
      transition: "all .2s ease",
      cursor: "pointer",
    },
    itemControl: {
      borderRadius: "xl",
    },
    itemIndicator: {
      borderWidth: "1px",
      borderColor: "border.emphasized",
      _checked: {
        bg: "colorPalette.solid",
        color: "colorPalette.contrast",
        borderColor: "colorPalette.solid",
      },
    },
  },
  variants: {
    variant: {
      surface: {
        item: {
          borderWidth: "1px",
          _hover: {
            bg: "green.50",
            borderColor: "green.200",
          },
          _checked: {
            bg: "colorPalette.subtle",
            color: "colorPalette.fg",
            borderColor: "colorPalette.muted",
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: "surface",
    size: "sm",
  },
})
