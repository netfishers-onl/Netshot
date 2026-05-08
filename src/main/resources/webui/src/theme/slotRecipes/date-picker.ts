import { defineSlotRecipe } from "@chakra-ui/react"
import { datePickerAnatomy } from "@chakra-ui/react/anatomy"

export const datePickerSlotRecipe = defineSlotRecipe({
  slots: datePickerAnatomy.keys(),
  base: {
    trigger: {
      w: "8",
      h: "8",
      borderRadius: "l1",
      transition: "all .2s ease",
      cursor: "pointer",
    },
    clearTrigger: {
      w: "8",
      h: "8",
      borderRadius: "l1",
    },
    content: {
      borderRadius: "xl",
    },
    control: {
      borderRadius: "xl",
      boxShadow: "initial!important",
    },
    input: {
      fontSize: "md",
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
          _hover: {
            bg: "grey.50",
          },
          _active: {
            bg: "grey.100",
          },
        },
        input: {
          borderRadius: "xl",
          border: "1px solid {colors.grey.100}",
          bg: "white",
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
        input: {
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
