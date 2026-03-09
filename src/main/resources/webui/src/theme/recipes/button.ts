import { defineRecipe, defineStyle } from "@chakra-ui/react"

const disabledStyle = defineStyle({
  bg: "grey.100!important",
  color: "grey.400!important",
  border: "none!important",
  opacity: "1!important",
})

export const buttonRecipe = defineRecipe({
  base: {
    "& svg": {
      width: "16px",
      height: "16px",
    },
    borderRadius: "xl",
    fontWeight: "600",
    "& span:nth-of-type(2)": {
      flex: "initial",
    },
  },
  variants: {
    variant: {
      default: {
        borderWidth: "1px",
        color: "black",
        borderColor: "grey.100",
        boxShadow: "0 2px 4px 0 rgba(202, 207, 226, .16)",
        _hover: {
          bg: "grey.50",
        },
        _active: {
          bg: "white",
        },
        _disabled: disabledStyle,
      },
      primary: {
        bg: "green.600",
        color: "white",
        boxShadow: "0 2px 4px 0 rgba(202, 207, 226, .16)",
        _hover: {
          bg: "green.500",
        },
        _active: {
          bg: "green.400",
        },
        _disabled: disabledStyle,
      },
      ghost: {
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
        _disabled: disabledStyle,
      },
      plain: {
        bg: "transparent",
        padding: "0",
        color: "black",
        height: "auto",
        borderBottomWidth: "1px",
        borderColor: "transparent",
        borderRadius: 0,
        _disabled: {
          color: "grey.400!important",
        },
      },
      navbar: {
        bg: "transparent",
        color: "white",
        _hover: {
          bg: "green.900",
        },
        _active: {
          bg: "green.900",
          color: "white",
        },
        "&.router-active": {
          bg: "green.900",
          color: "white",
        },
      },
      subtle: {
        color: {
          _light: "black",
          _dark: "white",
        },
        bg: {
          _light: "bg.subtle",
          _dark: "green.1000",
        },
        _hover: {
          bg: {
            _light: "bg.muted",
            _dark: "green.900",
          },
        },
      },
    },
    size: {
      sm: {
        fontSize: "md",
        height: "32px",
        minWidth: "32px",
      },
      md: {
        fontSize: "md",
        height: "40px",
        minWidth: "40px",
      },
      lg: {
        fontSize: "md",
        height: "48px",
        minWidth: "48px",
      },
    },
  },
  compoundVariants: [
    {
      variant: "primary",
      colorPalette: "red",
      css: {
        bg: "red.400",
        _hover: {
          bg: "red.300",
        },
        _active: {
          bg: "red.400",
        },
      },
    },
    {
      variant: "ghost",
      colorPalette: "green",
      css: {
        color: "green.600",
        _hover: {
          bg: "green.50",
        },
        _active: {
          bg: "green.100",
        },
      },
    },
    {
      variant: "ghost",
      colorPalette: "red",
      css: {
        color: "red.500",
        _hover: {
          bg: "red.50",
        },
        _active: {
          bg: "red.100",
        },
      },
    },
    {
      variant: "plain",
      colorPalette: "green",
      css: {
        color: "green.600",
        _hover: {
          borderBottomColor: "green.600",
        },
      },
    },
    {
      variant: "plain",
      colorPalette: "red",
      css: {
        color: "red.500",
        _hover: {
          borderBottomColor: "red.500",
        },
      },
    },
    {
      variant: "plain",
      colorPalette: "white",
      css: {
        color: "white",
        _hover: {
          borderBottomColor: "white",
        },
      },
    },
  ],
  defaultVariants: {
    size: "md",
    variant: "default",
  },
})
