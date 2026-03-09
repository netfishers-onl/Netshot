import { createSystem, defaultConfig } from "@chakra-ui/react"
import recipes from "./recipes"
import { semanticColors } from "./semantic-tokens/colors"
import slotRecipes from "./slotRecipes"
import { textStyles } from "./textStyles"
import { colors } from "./tokens/colors"
import { fonts } from "./tokens/fonts"
import { fontSizes } from "./tokens/fontSizes"
import { fontWeights } from "./tokens/fontWeights"
import { letterSpacings } from "./tokens/letterSpacing"
import { lineHeights } from "./tokens/lineHeights"
import { radii } from "./tokens/radii"
import sizes from "./tokens/sizes"
import { spacing } from "./tokens/spacing"

export const tokens = {
  colors,
  radii,
  spacing,
  sizes,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
}

export const semanticTokens = {
  colors: semanticColors,
}

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "14px",
      letterSpacing: "-0.14px",
      // colorPalette: "green",
    },
    ":not(.chakra-dont-set-collapse) > .chakra-collapse": {
      overflow: "initial !important",
    },
    body: {
      bg: "white",
    },
  },
  theme: {
    recipes,
    slotRecipes,
    semanticTokens,
    tokens,
    textStyles,
  },
})
