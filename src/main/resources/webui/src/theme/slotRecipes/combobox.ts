import { defineSlotRecipe } from "@chakra-ui/react"
import { comboboxAnatomy } from "@chakra-ui/react/anatomy"

export const comboboxSlotRecipe = defineSlotRecipe({
  slots: comboboxAnatomy.keys(),
  base: {},
  variants: {
    variant: {
      outline: {
        input: {
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
        content: {
          borderRadius: "2xl",
          p: 2,
          border: "none",
          boxShadow: "0 2px 10px 0 rgba(140, 149, 159, .16)",
          textStyle: "md",
        },
        item: {
          cursor: "pointer",
          py: "2",
          px: "3",
          borderRadius: "lg",
          transition: "all .2s ease",
          bg: "white",
          _hover: {
            bg: "green.50",
            color: "green.800",
          },
          _focus: {
            bg: "green.50",
            color: "green.800",
          },
        },
        clearTrigger: {
          "& svg": {
            width: "16px",
            height: "16px",
          },
          bg: "transparent",
          color: {
            _light: "black",
            _dark: "white",
          },
          _hover: {
            bg: "grey.50",
          },
          _active: {
            bg: "grey.100",
          },
        },
      },
    },
    size: {
      md: {
        input: {
          h: "42px",
        },
        clearTrigger: {
          fontSize: "md",
          height: "40px",
          minWidth: "40px",
        }
      }
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
})
