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
          borderWidth: "2px",
          _hover: {
            borderColor: "colorPalette.muted",
          },
          _checked: {
            bg: "transparent",
            borderColor: "colorPalette.solid",
            _hover: {
              bg: "transparent",
              borderColor: "colorPalette.solid",
            },
          },
        },
        itemControl: {
          _checked: {
            bg: "transparent",
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: "surface",
  },
})
