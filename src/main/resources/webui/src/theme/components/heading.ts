import { defineStyleConfig } from "@chakra-ui/react";

/**
 * Permet de surcharger le style du composant "Heading"
 */
export const Heading = defineStyleConfig({
	sizes: {
		md: {
			fontSize: "lg",
		},
		lg: {
			fontSize: "2xl",
		},
	},
});
