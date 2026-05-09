import { defineSemanticTokens } from "@chakra-ui/react"

export const semanticColors = defineSemanticTokens.colors({
  silver: {
    contrast: { value: { _light: "white", _dark: "black" } },
    fg: { value: { _light: "{colors.silver.700}", _dark: "{colors.silver.300}" } },
    subtle: { value: { _light: "{colors.silver.100}", _dark: "{colors.silver.900}" } },
    muted: { value: { _light: "{colors.silver.200}", _dark: "{colors.silver.800}" } },
    emphasized: { value: { _light: "{colors.silver.300}", _dark: "{colors.silver.700}" } },
    solid: { value: { _light: "{colors.silver.600}", _dark: "{colors.silver.600}" } },
    focusRing: { value: { _light: "{colors.silver.500}", _dark: "{colors.silver.500}" } },
    border: { value: { _light: "{colors.silver.500}", _dark: "{colors.silver.400}" } },
  },
  gold: {
    contrast: { value: { _light: "black", _dark: "black" } },
    fg: { value: { _light: "{colors.gold.700}", _dark: "{colors.gold.300}" } },
    subtle: { value: { _light: "{colors.gold.100}", _dark: "{colors.gold.900}" } },
    muted: { value: { _light: "{colors.gold.200}", _dark: "{colors.gold.800}" } },
    emphasized: { value: { _light: "{colors.gold.300}", _dark: "{colors.gold.700}" } },
    solid: { value: { _light: "{colors.gold.500}", _dark: "{colors.gold.400}" } },
    focusRing: { value: { _light: "{colors.gold.500}", _dark: "{colors.gold.500}" } },
    border: { value: { _light: "{colors.gold.500}", _dark: "{colors.gold.400}" } },
  },
  bronze: {
    contrast: { value: { _light: "white", _dark: "black" } },
    fg: { value: { _light: "{colors.bronze.700}", _dark: "{colors.bronze.300}" } },
    subtle: { value: { _light: "{colors.bronze.100}", _dark: "{colors.bronze.900}" } },
    muted: { value: { _light: "{colors.bronze.200}", _dark: "{colors.bronze.800}" } },
    emphasized: { value: { _light: "{colors.bronze.300}", _dark: "{colors.bronze.700}" } },
    solid: { value: { _light: "{colors.bronze.600}", _dark: "{colors.bronze.600}" } },
    focusRing: { value: { _light: "{colors.bronze.500}", _dark: "{colors.bronze.500}" } },
    border: { value: { _light: "{colors.bronze.500}", _dark: "{colors.bronze.400}" } },
  },
  /* border: {
      default: {
        default: "lightGrey.100",
        _dark: "darkGrey.800",
      },
      input: {
        default: {
          default: "lightGrey.100",
          _dark: "darkGrey.600",
        },
        hovered: {
          default: "lightGrey.200",
          _dark: "darkGrey.500",
        },
        focused: {
          default: "blue.500",
          _dark: "blue.500",
        },
      },
    },
    bg: {
      default: {
        default: "white",
        _dark: "darkGrey.900",
      },
      hovered: {
        default: "lightGrey.100",
        _dark: "darkGrey.800",
      },
      input: {
        default: "white",
        _dark: "darkGrey.800",
      },
      table: {
        stripped: {
          default: "lightGrey.50",
          _dark: "darkGrey.800",
        },
      },
      disabled: {
        default: "lightGrey.200",
        _dark: "darkGrey.600",
      },
      checked: {
        default: "blue.500",
        _dark: "blue.500",
      },
    },
    color: {
      default: {
        default: "darkGrey.900",
        _dark: "white",
      },
      danger: {
        default: "red.500",
        _dark: "red.400",
      },
      placeholder: {
        default: "darkGrey.50",
        _dark: "darkGrey.50",
      },
      disabled: {
        default: "lightGrey.800",
        _dark: "darkGrey.50",
      },
    },
    primary: {
      default: "blue.500",
      _dark: "blue.500",
    },
    error: {
      default: "red.500",
      _dark: "red.400",
    },
    success: {
      default: "green.500",
      _dark: "green.400",
    },
    info: {
      default: "blue.500",
      _dark: "blue.400",
    },
    warning: {
      default: "yellow.500",
      _dark: "yellow.400",
    },
  }, */
})
