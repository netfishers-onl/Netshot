import { defineSlotRecipe } from "@chakra-ui/react"
import { listboxAnatomy } from "@chakra-ui/react/anatomy"

export const listboxSlotRecipe = defineSlotRecipe({
  slots: listboxAnatomy.keys(),
  base: {
    item: {
      borderRadius: "lg",
      transition: "all .2s ease",
      _hover: {
        bg: "green.50",
        color: "green.800",
      },
      _highlighted: {
        bg: "green.50",
        color: "green.800",
        outline: "none",
      },
      _selected: {
        bg: "green.50",
        color: "green.800",
      },
    },
    itemIndicator: {
      color: "green.700",
    },
  },
  variants: {
    variant: {
      subtle: {
        content: {
          bg: "transparent",
          borderWidth: "0",
          borderRadius: "0",
        },
      },
    },
  },
  defaultVariants: {
    variant: "subtle",
  },
})
