import { defineSlotRecipe } from "@chakra-ui/react"
import { selectAnatomy } from "@chakra-ui/react/anatomy"

export const selectSlotRecipe = defineSlotRecipe({
  slots: selectAnatomy.keys(),
  base: {
    trigger: {
      borderRadius: "xl",
      transition: "all .2s ease",
      cursor: "pointer",
    },
    content: {
      borderRadius: "xl",
    },
    item: {
      borderRadius: "md",
      cursor: "pointer",
      transition: "all .2s ease",
      _hover: {
        bg: "green.50",
      },
      _selected: {
        bg: "green.50",
      },
    },
    itemText: {
      _selected: {
        color: "green.800",
      },
    },
    itemIndicator: {
      _selected: {
        bg: "green.800",
      },
    },
    control: {
      borderRadius: "xl",
      boxShadow: "initial!important",
    },
  },
  variants: {
    variant: {
      subtle: {
        trigger: {
          bg: {
            _dark: "green.1000",
          },
          color: {
            _dark: "white",
          },
          _hover: {
            bg: "green.900",
          },
        },
        indicator: {
          color: "green.500",
        },
      },
      outline: {
        trigger: {
          border: "1px solid {colors.grey.100}",
          _focus: {
            borderColor: "green.400",
            outline: "3px solid",
            outlineColor: "blue.500/16",
            bg: "white",
          },
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
        control: {
          bg: "white",
          _hover: {
            borderColor: "grey.200",
            bg: "white",
          },
          _focus: {
            borderColor: "green.400",
            outline: "3px solid",
            outlineColor: "blue.500/16",
            bg: "white",
          },
          _placeholder: {
            color: "grey.400",
          },
        },
      },
      prefix: {
        trigger: {
        },
        indicator: {
          color: "green.500",
        },
        
      },
    },
    size: {
      lg: {
        trigger: {
          h: "40px",
          minH: "40px",
        },
      },
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "lg",
  },
})
