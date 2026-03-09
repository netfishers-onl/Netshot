import { defineRecipe } from "@chakra-ui/react"

export const formLabelRecipe = defineRecipe({
  base: {
    fontSize: "md",
    marginEnd: "3",
    mb: "1",
    fontWeight: "medium",
    transitionProperty: "common",
    transitionDuration: "normal",
    opacity: 1,
    _disabled: {
      opacity: 0.4,
    },
  },
})
