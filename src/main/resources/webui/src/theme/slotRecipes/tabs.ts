import { defineSlotRecipe } from "@chakra-ui/react"
import { tabsAnatomy } from "@chakra-ui/react/anatomy"

export const tabsSlotRecipe = defineSlotRecipe({
  slots: tabsAnatomy.keys(),
  variants: {
    variant: {
      default: {
        trigger: {
          borderBottom: "1px solid",
          borderColor: "transparent",
          marginBottom: "-1px",
          _selected: {
            color: "black",
            borderColor: "green.500",
          },
        },
        list: {
          borderBottom: "1px solid {colors.grey.100}",
        },
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})
