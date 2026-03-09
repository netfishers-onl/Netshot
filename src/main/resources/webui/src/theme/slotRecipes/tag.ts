import { defineSlotRecipe } from "@chakra-ui/react"
import { tagAnatomy } from "@chakra-ui/react/anatomy"

export const tagSlotRecipe = defineSlotRecipe({
  slots: tagAnatomy.keys(),
  base: {
    root: {
      borderRadius: "md",
    },
  },
})
