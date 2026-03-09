import { defineRecipe } from "@chakra-ui/react"
/**
 * Permet de surcharger le style du composant "Input"
 */
export const inputRecipe = defineRecipe({
  variants: {
    variant: {
      outline: {
        borderRadius: "xl",
        border: "1px solid {colors.grey.100}",
        bg: "white",
        fontSize: "md",
        _hover: {
          borderColor: "grey.200",
        },
        _focus: {
          borderColor: "green.400",
          outline: "3px solid",
          outlineColor: "green.600/10",
        },
        _placeholder: {
          opacity: 1,
          color: "grey.400",
        },
        boxShadow: "initial!important",
        _disabled: {
          opacity: 1,
          bg: "grey.100",
          color: "grey.600",
        },
        _readOnly: {
          bg: "grey.100",
          color: "grey.600",
          outline: "0!important",
          borderColor: "grey.100!important",
        },
      },
      subtle: {
        borderRadius: "xl",
        fontSize: "md",
        bg: {
          _light: "grey.100",
          _dark: "whiteAlpha.100",
        },
        color: {
          _light: "black",
          _dark: "white",
        },
        _placeholder: {
          color: {
            _light: "grey.400",
            _dark: "whiteAlpha.600",
          },
        },
        _icon: {
          color: {
            _light: "black",
            _dark: "white",
          },
        },
        _readOnly: {
          bg: {
            _light: "grey.100",
            _dark: "whiteAlpha.100",
          },
          color: {
            _light: "black",
            _dark: "white",
          },
        },
      },
    },
    size: {
      md: {
        h: "42px",
      },
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
})
