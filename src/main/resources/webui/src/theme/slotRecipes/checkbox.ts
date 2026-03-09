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
      boxShadow: "0 2px 4px 0 rgba(202, 207, 226, .16)",
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
