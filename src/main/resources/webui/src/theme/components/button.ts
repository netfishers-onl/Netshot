import {
  SystemStyleObject,
  defineStyle,
  defineStyleConfig,
} from "@chakra-ui/react";

const disabledStyle = defineStyle({
  bg: "grey.100!important",
  color: "grey.400!important",
  border: "none!important",
  opacity: "1!important",
});

const defaultStyle = defineStyle({
  border: "1px",
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
});

const primary = defineStyle((props) => {
  const { colorScheme } = props;

  const styles: SystemStyleObject = {
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
  };

  if (colorScheme === "red") {
    styles.bg = "red.400";
    styles._hover.bg = "red.300";
    styles._active.bg = "red.400";
  }

  return styles;
});

const ghost = defineStyle((props) => {
  const { colorScheme } = props;

  const styles: SystemStyleObject = {
    bg: "transparent",
    color: "black",
    _hover: {
      bg: "grey.50",
    },
    _active: {
      bg: "grey.100",
    },
    _disabled: disabledStyle,
  };

  if (colorScheme === "green") {
    styles.color = "green.600";
    styles._hover.bg = "green.50";
    styles._active.bg = "green.100";
  } else if (colorScheme === "red") {
    styles.color = "red.500";
    styles._hover.bg = "red.50";
    styles._active.bg = "red.100";
  }

  return styles;
});

const plain = defineStyle((props) => {
  const { colorScheme } = props;

  const styles: SystemStyleObject = {
    bg: "transparent",
    padding: "0",
    color: "black",
    height: "auto",
    borderBottomWidth: "1px",
    borderColor: "transparent",
    borderRadius: 0,
    _hover: {
      borderColor: "black",
    },
    _disabled: defineStyle({
      color: "grey.400!important",
    }),
  };

  if (colorScheme === "green") {
    styles.color = "green.600";
    // @ts-ignore
    styles._hover.borderBottomColor = "green.600";
  } else if (colorScheme === "red") {
    styles.color = "red.500";
    // @ts-ignore
    styles._hover.borderBottomColor = "red.500";
  } else if (colorScheme === "white") {
    styles.color = "white";
    // @ts-ignore
    styles._hover.borderBottomColor = "white";
  }

  return styles;
});

const navbar = defineStyle({
  bg: "transparent",
  color: "white",
  _hover: {
    bg: "green.900",
  },
  _active: {
    bg: "green.900",
    color: "white",
  },
});

export const Button = defineStyleConfig({
  baseStyle: {
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
  sizes: {
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
  variants: {
    default: defaultStyle,
    primary,
    ghost,
    plain,
    navbar,
  },
  defaultProps: {
    size: "md",
    variant: "default",
  },
});
