import { cssVar, defineStyle, defineStyleConfig } from "@chakra-ui/react";

const $startColor = cssVar("skeleton-start-color");
const $endColor = cssVar("skeleton-end-color");

const base = defineStyle({
  borderRadius: "lg",
  _light: {
    [$startColor.variable]: "colors.grey.50",
    [$endColor.variable]: "colors.grey.100",
  },
  _dark: {
    [$startColor.variable]: "colors.darkGrey.700",
    [$endColor.variable]: "colors.darkGrey.800",
  },
});
export const Skeleton = defineStyleConfig({
  variants: { base },
  defaultProps: {
    variant: "base",
  },
});
