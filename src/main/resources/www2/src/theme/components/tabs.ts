import { tabsAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tabsAnatomy.keys);

const variants = {
  default: definePartsStyle((props) => ({
    root: {},
    tab: {
      borderBottom: "1px solid",
      borderColor: "transparent",
      marginBottom: "-1px",
      _selected: {
        color: "black",
        borderColor: "green.500",
      },
    },
    tabpanel: {},
    tablist: {
      borderBottom: "1px solid",
      borderBottomColor: "grey.100",
    },
  })),
};

export const Tabs = defineMultiStyleConfig({
  variants,
  defaultProps: {
    variant: "default",
  },
});
