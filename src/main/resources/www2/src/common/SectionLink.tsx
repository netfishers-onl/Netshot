import { createStyles, getStylesRef } from "@mantine/core";
import { Icon } from "@tabler/icons-react";
import { Link, useMatch, useResolvedPath } from "react-router-dom";

const useStyles = createStyles((theme) => {
	return {
		link: {
			...theme.fn.focusStyles(),
			display: "flex",
			alignItems: "center",
			textDecoration: "none",
			fontSize: theme.fontSizes.sm,
			color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.gray[7],
			padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
			borderRadius: theme.radius.sm,
			fontWeight: 500,

			"&:hover": {
				backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
				color: theme.colorScheme === "dark" ? theme.white : theme.black,

				[`& .${getStylesRef("icon")}`]: {
					color: theme.colorScheme === "dark" ? theme.white : theme.black,
				},
			},
		},

		linkIcon: {
			ref: getStylesRef("icon"),
			color: theme.colorScheme === "dark" ? theme.colors.dark[2] : theme.colors.gray[6],
			[theme.fn.largerThan("sm")]: {
				marginRight: theme.spacing.sm,
			},
		},

		linkActive: {
			"&, &:hover": {
				backgroundColor:
					theme.colorScheme === "dark" ?
						theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.25) :
						theme.colors[theme.primaryColor][0],
				color: theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 7],
				[`& .${getStylesRef("icon")}`]: {
					color: theme.fn.variant({ variant: 'light', color: theme.primaryColor }).color,
				},
			},
		},

		label: {
			[theme.fn.smallerThan("sm")]: {
				display: "none",
			},
		}
	};
});

export interface SectionLinkProps {
	label: string,
	link: string,
	icon: Icon,
}

export function SectionLink({ sectionLink }: { sectionLink: SectionLinkProps }) {
	const { classes, cx } = useStyles();
	const resolved = useResolvedPath(sectionLink.link);
	const isActive = useMatch({ path: resolved.pathname, end: false });

	return (
		<Link
			className={cx(classes.link, { [classes.linkActive]: isActive })}
			to={sectionLink.link}
			key={sectionLink.label}
		>
			<sectionLink.icon className={classes.linkIcon} />
			<span className={classes.label}>{sectionLink.label}</span>
		</Link>
	);
}
