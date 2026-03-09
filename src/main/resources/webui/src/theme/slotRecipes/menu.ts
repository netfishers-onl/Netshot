import { defineSlotRecipe } from "@chakra-ui/react"
import { menuAnatomy } from "@chakra-ui/react/anatomy"

export const menuSlotRecipe = defineSlotRecipe({
  slots: menuAnatomy.keys(),
  base: {
    content: {
      borderRadius: "2xl",
      p: 2,
      border: "none",
      boxShadow: "0 2px 10px 0 rgba(140, 149, 159, .16)",
    },
    item: {
      h: "42px",
      borderRadius: "lg",
      transition: "all .2s ease",
      bg: "white",
      _hover: {
        bg: "green.50",
        color: "green.800",
      },
      _focus: {
        bg: "green.50",
        color: "green.800",
      },
    },
  },
  variants: {
    size: {
      md: {
        item: {
          textStyle: "md",
        },
      },
    },
  },
})
