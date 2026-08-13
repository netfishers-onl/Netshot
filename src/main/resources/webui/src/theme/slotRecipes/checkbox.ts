import { defineSlotRecipe } from "@chakra-ui/react"
import { checkboxAnatomy } from "@chakra-ui/react/anatomy"

export const checkboxSlotRecipe = defineSlotRecipe({
  slots: checkboxAnatomy.keys(),
  base: {
    root: {
      colorPalette: "green",
    },
    control: {
      borderRadius: "md",
      border: "1px solid {colors.grey.100}",
      bg: "white",
      transition: "all .2s ease",
    },
    indicator: {
      color: "white",
      _checked: {
        color: "white",
      },
    },
  },
})
