import { defineSlotRecipe } from "@chakra-ui/react"
import { progressAnatomy } from "@chakra-ui/react/anatomy"

export const progressSlotRecipe = defineSlotRecipe({
  slots: progressAnatomy.keys(),
  base: {
    circleRange: {
      bg: "blue.500",
    },
    circleTrack: {
      bg: {
        _light: "lightGrey.100",
        _dark: "darkGrey.700",
      },
    },
  },
  variants: {
    size: {
      md: {},
    },
  },
  defaultVariants: {
    size: "md",
    colorPalette: "blue",
  },
})
