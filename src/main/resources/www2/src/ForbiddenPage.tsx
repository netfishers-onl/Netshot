import React from "react";
import { createStyles, Title, Text, Button, Container, Group } from "@mantine/core";
import { Link } from "react-router-dom";
import { NetshotLogo } from "./NetshotLogo";

const useStyles = createStyles((theme) => ({
	root: {
		paddingTop: 80,
		paddingBottom: 80,
	},

	label: {
		textAlign: "center",
		fontWeight: 900,
		fontSize: 220,
		lineHeight: 1,
		marginBottom: theme.spacing.xl * 1.5,
		color: theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2],

		[theme.fn.smallerThan("sm")]: {
			fontSize: 120,
		},
	},

	title: {
		fontFamily: `Greycliff CF, ${theme.fontFamily}`,
		textAlign: "center",
		fontWeight: 900,
		fontSize: 38,

		[theme.fn.smallerThan("sm")]: {
			fontSize: 32,
		},
	},

	description: {
		maxWidth: 500,
		margin: "auto",
		marginTop: theme.spacing.xl,
		marginBottom: theme.spacing.xl * 1.5,
	},
}));

export function ForbiddenPage() {
	const { classes } = useStyles();

	return (
		<Container className={classes.root}>
			<div className={classes.label}>403</div>
			<Title className={classes.title}>Forbidden.</Title>
			<Text color="dimmed" size="lg" align="center" className={classes.description}>
				You are not allowed to access this page. Please check your account's permission level.
			</Text>
			<Group position="center" m="md">
				<Button variant="subtle" size="md" component={Link} to="/home">
					Go to home page
				</Button>
			</Group>
			<Group position="center">
				<NetshotLogo />
			</Group>
		</Container>
	);
}