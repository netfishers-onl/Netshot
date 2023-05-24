import React from "react";
import { createStyles } from "@mantine/core";

const useStyles = createStyles((theme) => ({
	page: {
		flex: "1 1 100%",
	},
}));

export function DevicePage() {
	const { classes } = useStyles();

	return (
		<div className={classes.page}>
			DEVICES
		</div>
	);
}