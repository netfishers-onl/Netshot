import { defineRecipe } from "@chakra-ui/react"

export const headingRecipe = defineRecipe({
  variants: {
    size: {
      md: {
        fontSize: "lg",
      },
      lg: {
        fontSize: "2xl",
      },
    },
  },
})
