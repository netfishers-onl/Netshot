import { defineSlotRecipe } from "@chakra-ui/react"
import { popoverAnatomy } from "@chakra-ui/react/anatomy"

export const popoverSlotRecipe = defineSlotRecipe({
  slots: popoverAnatomy.keys(),
  base: {
    content: {
      borderRadius: "xl",
    },
  },
})
