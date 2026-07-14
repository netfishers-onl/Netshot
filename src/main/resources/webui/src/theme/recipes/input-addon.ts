import { defineRecipe } from "@chakra-ui/react"
/**
 * Allows overriding the style of the "InputAddon" component (used to attach
 * static or interactive content, e.g. a unit label or a select, to an Input).
 */
export const inputAddonRecipe = defineRecipe({
  variants: {
    variant: {
      outline: {
        borderRadius: "xl",
        border: "1px solid {colors.grey.100}",
        bg: "grey.50",
      },
    },
  },
  defaultVariants: {
    variant: "outline",
  },
})
