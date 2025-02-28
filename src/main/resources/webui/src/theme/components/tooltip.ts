import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

/**
 * Permet de surcharger le style du tooltip
 */
export const Tooltip = defineStyleConfig({
	baseStyle: defineStyle({
		borderRadius: "md",
		bg: "gray.800",
		color: "white",
		_dark: {
			bg: "gray.900",
		},
	}),
});
