import { defineRecipe } from "@chakra-ui/react"

export const textRecipe = defineRecipe({
  variants: {
    size: {
      md: { fontSize: "md", lineHeight: "1.5rem" },
    },
  },
  defaultVariants: {
    size: "md",
  },
})
