/**
 * @note Liste des tokens utilisable dans l'appli (alias pour les couleurs, espaces, etc.)
 */
export type ColorToken = {
  default: string;
  _dark: string;
};

export type SemanticTokens = {
  colors: {
    border: {
      default: ColorToken;
      input: {
        default: ColorToken;
        hovered: ColorToken;
        focused: ColorToken;
      };
    };
    background: {
      default: ColorToken;
      hovered: ColorToken;
      input: ColorToken;
      disabled: ColorToken;
      table: {
        stripped: ColorToken;
      };
      checked: ColorToken;
    };
    text: {
      default: ColorToken;
      placeholder: ColorToken;
      disabled: ColorToken;
    };
    primary: ColorToken;
    error: ColorToken;
    success: ColorToken;
    info: ColorToken;
    warning: ColorToken;
  };
};

export default {
  colors: {
    border: {
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
    background: {
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
    text: {
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
  },
} as SemanticTokens;
