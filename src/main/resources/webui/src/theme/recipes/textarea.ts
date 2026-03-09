import { defineRecipe } from "@chakra-ui/react"

export const textAreaRecipe = defineRecipe({
  variants: {
    variant: {
      outline: {
        py: 4,
        borderRadius: "xl",
        border: "1px solid {colors.grey.100}",
        bg: "white",
        "&:hover": {
          borderColor: "grey.200",
        },
        "&:focus": {
          borderColor: "green.400",
          outline: "3px solid",
          outlineColor: "green.600/16",
          bg: "white",
        },
        boxShadow: "initial!important",
      },
    },
    size: {
      lg: {},
    },
  },
  defaultVariants: {
    size: "lg",
  },
})
