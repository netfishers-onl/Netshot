import { defineRecipe } from "@chakra-ui/react"

export const tooltipRecipe = defineRecipe({
  base: {
    borderRadius: "md",
    bg: "gray.800",
    color: "white",
    _dark: {
      bg: "gray.900",
    },
  },
})
