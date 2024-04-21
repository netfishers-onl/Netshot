import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

export const Spinner = defineStyleConfig({
  variants: {
    default: defineStyle({
      color: "green.600",
    }),
  },
  defaultProps: {
    variant: "default",
  },
});
