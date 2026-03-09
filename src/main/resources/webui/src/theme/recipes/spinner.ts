import { defineRecipe } from "@chakra-ui/react"

export const spinnerRecipe = defineRecipe({
  variants: {
    variant: {
      default: {
        color: "green.600",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})
