import { defineStyle, defineStyleConfig } from "@chakra-ui/react";
import { transparentize } from "../utils";

const outlineColor = transparentize("green.600", 0.16);

const sizes = {
  md: defineStyle({
    height: "40px",
  }),
};

const outline = defineStyle({
  py: 4,
  borderRadius: "xl",
  border: "1px",
  bg: "white",
  borderColor: "grey.100",
  "&:hover": {
    borderColor: "grey.200",
  },
  "&:focus": {
    borderColor: "green.400",
    outline: "3px solid",
    outlineColor,
    bg: "white",
  },
  boxShadow: "initial!important",
});

export const Textarea = defineStyleConfig({
  variants: {
    outline,
  },
  sizes,
  defaultProps: {
    variant: "outline",
    size: "md",
  },
});
