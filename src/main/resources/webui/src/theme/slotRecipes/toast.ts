import { defineSlotRecipe } from "@chakra-ui/react"
import { toastAnatomy } from "@chakra-ui/react/anatomy"

export const toastSlotRecipe = defineSlotRecipe({
  slots: toastAnatomy.keys(),
  base: {
    root: {
      bg: "white",
      color: "black",
      borderRadius: "2xl",
      py: "6",
      pl: "6",
      pr: "16",
      boxShadow: "0 2px 10px 0 rgba(140, 149, 159, .16)",
      minWidth: "410px",
      position: "relative",
    },
  },
  variants: {
    script: {
      true: {
        root: {
          pr: "6",
        },
      },
    },
  },
  defaultVariants: {
    script: false,
  },
})
