import { defineSlotRecipe } from "@chakra-ui/react"
import { numberInputAnatomy } from "@chakra-ui/react/anatomy"

export const numberInputSlotRecipe = defineSlotRecipe({
  slots: numberInputAnatomy.keys(),
  base: {
    // When wrapped in an attached `Group` (e.g. `InputGroup`'s `endAddon`), it clones
    // data-first/data-between/data-last onto the root - the actual bordered box is the
    // nested input/trigger parts, so the radius reset has to target them specifically
    // rather than relying on Group's own (too shallow) CSS.
    input: {
      "[data-first] &": { borderEndRadius: "0" },
      "[data-between] &": { borderRadius: "0" },
      "[data-last] &": { borderStartRadius: "0" },
    },
    control: {
      borderStartColor: "grey.100",
    },
    incrementTrigger: {
      borderTopEndRadius: "xl",
      "[data-first] &": { borderTopEndRadius: "0" },
      "[data-between] &": { borderTopEndRadius: "0" },
    },
    decrementTrigger: {
      borderBottomEndRadius: "xl",
      "[data-first] &": { borderBottomEndRadius: "0" },
      "[data-between] &": { borderBottomEndRadius: "0" },
    },
  },
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
      },
    },
    size: {
      md: {
        input: {
          h: "42px",
        },
      },
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
})
