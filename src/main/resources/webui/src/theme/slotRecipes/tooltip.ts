import { defineSlotRecipe } from "@chakra-ui/react"
import { tooltipAnatomy } from "@chakra-ui/react/anatomy"

export const tooltipSlotRecipe = defineSlotRecipe({
  slots: tooltipAnatomy.keys(),
  base: {
    content: {
      borderRadius: "md",
    },
  },
})
