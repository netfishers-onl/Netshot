import { defineSlotRecipe } from "@chakra-ui/react"
import { floatingPanelAnatomy } from "@chakra-ui/react/anatomy"

export const floatingPanelSlotRecipe = defineSlotRecipe({
  slots: floatingPanelAnatomy.keys(),
  base: {
    content: {
      borderRadius: "xl",
    },
    header: {
      bg: "grey.50",
    },
    title: {
      fontSize: "md",
    },
  },
})
