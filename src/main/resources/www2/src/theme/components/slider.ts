import { sliderAnatomy as parts } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

/**
 * @note Permet de surcharger le composant "Slider"
 */
const baseStyle = definePartsStyle({
  thumb: {
    bg: 'blue.500',
    boxSize: "16px",
    border: "2px",
    borderColor: "white",
    _dark: {
      bg: 'white',
      borderColor: "darkGrey.900"
    }
  },
  track: {
    bg: "lightGrey.100",
    _dark: {
      bg: "darkGrey.700"
    }
  },
  filledTrack: {
    bg: 'blue.500',
    borderRadius: "full"
  },
})
export const Slider = defineMultiStyleConfig({ baseStyle })