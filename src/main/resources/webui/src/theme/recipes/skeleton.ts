import { defineRecipe } from "@chakra-ui/react"

export const skeletonRecipe = defineRecipe({
  variants: {
    variant: {
      default: {
        borderRadius: "lg",
        _light: {
          "--skeleton-start-color": "colors.grey.50",
          "--skeleton-end-color": "colors.grey.100",
        },
        _dark: {
          "--skeleton-start-color": "colors.darkGrey.700",
          "--skeleton-end-color": "colors.darkGrey.800",
        },
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})
