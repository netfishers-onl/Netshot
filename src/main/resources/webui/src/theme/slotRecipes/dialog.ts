import { defineSlotRecipe } from "@chakra-ui/react"
import { dialogAnatomy } from "@chakra-ui/react/anatomy"

export const dialogSlotRecipe = defineSlotRecipe({
  slots: dialogAnatomy.keys(),
  base: {
    backdrop: {
      background: "green.1100/50",
      backdropFilter: "blur(14px)",
    },
    content: {
      borderRadius: "3xl",
      fontSize: "md",
    },
    header: {
      p: 7,
    },
    footer: {
      p: 7,
    },
    closeTrigger: {
      top: 6,
      insetInlineEnd: 6,
    },

  },
  variants: {
    variant: {
      floating: {
        positioner: {
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "20px",
          pointerEvents: "none",
        },
        content: {
          pointerEvents: "auto",
          m: 0,
          height: "100%",
          borderRadius: "3xl",
          maxHeight: "initial",
        },
        body: {
          p: 0,
          overflow: "auto",
        },
      },
      "full-floating": {
        positioner: {
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        },
        content: {
          m: 0,
          width: "100%",
          height: "100%",
          borderRadius: "3xl",
          maxHeight: "initial",
          maxWidth: "initial",
        },
        body: {
          display: "flex",
          flexDirection: "column",
        },
      },
    },
    size: {
      "2xl": {
        content: {
          maxW: "2xl",
        },
      },
      "3xl": {
        content: {
          maxW: "3xl",
        },
      },
      "4xl": {
        content: {
          maxW: "4xl",
        },
      },
      "5xl": {
        content: {
          maxW: "5xl",
        },
      },
      "6xl": {
        content: {
          maxW: "6xl",
        },
      },
      full: {
        content: {
          maxW: "full",
        },
      },
    },
  },
})
