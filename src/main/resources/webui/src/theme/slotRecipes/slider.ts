import { defineSlotRecipe } from "@chakra-ui/react"
import { sliderAnatomy } from "@chakra-ui/react/anatomy"

export const sliderSlotRecipe = defineSlotRecipe({
  slots: sliderAnatomy.keys(),
  base: {
    thumb: {
      bg: "blue.500",
      boxSize: "16px",
      border: "2px",
      borderColor: "white",
      _dark: {
        bg: "white",
        borderColor: "darkGrey.900",
      },
    },
    track: {
      bg: "lightGrey.100",
      _dark: {
        bg: "darkGrey.700",
      },
    },
    /* filledTrack: {
      bg: "blue.500",
      borderRadius: "full",
    }, */
  },
})
