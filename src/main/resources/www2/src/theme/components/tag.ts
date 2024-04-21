import { tagAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tagAnatomy.keys)

/**
 * Permet de surcharger le style du Tag
 */
export const Tag = defineMultiStyleConfig({
  sizes: {
    md: definePartsStyle({
      container: {
        height: "18px"
      }
    })
  },
  variants: {
    default: definePartsStyle({
      container: {
        borderRadius: "md",
        fontSize: "md",
        _dark: {
          bg: "darkGrey.700",
          color: "lightGrey.600",
        }
      }
    }),
  },
  defaultProps: {
    size: "md",
  },
});
