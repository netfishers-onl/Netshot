import { createStyles, Header, Container, Anchor, Group, UnstyledButton, Text, Center, HoverCard, Box, Stack, Flex, rem } from "@mantine/core";
import { NetshotLogo } from "./NetshotLogo";
import { Link, useMatch, useResolvedPath } from "react-router-dom";
import { AuthdSection } from "./AuthProvider";
import { IconChevronDown } from "@tabler/icons-react";

const HEADER_HEIGHT = rem(84);
const HEADER_SM = rem(868);

const useStyles = createStyles((theme) => ({
	header: {
		backgroundColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
		borderBottom: 0,
	},

	inner: {
		height: HEADER_HEIGHT,
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},

	burger: {
		[theme.fn.largerThan(HEADER_SM)]: {
			display: "none",
		},
	},

	links: {
		paddingTop: theme.spacing.lg,
		height: HEADER_HEIGHT,
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		flex: "1 0",

		[theme.fn.smallerThan(HEADER_SM)]: {
			display: "none",
		},
	},

	mainLinks: {
		marginRight: -theme.spacing.sm,
	},

	mainLink: {
		textTransform: "uppercase",
		textDecoration: "none",
		fontSize: rem(13),
		color: theme.white,
		padding: `${rem(7)} ${theme.spacing.sm}`,

		
		fontWeight: 700,
		borderBottom: `${rem(2)} solid transparent`,
		transition: "border-color 100ms ease, opacity 100ms ease",
		opacity: 0.9,
		borderTopRightRadius: theme.radius.sm,
		borderTopLeftRadius: theme.radius.sm,

		"&:hover": {
			opacity: 1,
			textDecoration: "none",
		},
	},

	secondaryLink: {
		color: theme.colors[theme.primaryColor][0],
		fontSize: theme.fontSizes.xs,
		textTransform: "uppercase",
		transition: "color 100ms ease",

		"&:hover": {
			color: theme.white,
			textDecoration: "none",
		},
	},

	mainLinkActive: {
		color: theme.white,
		opacity: 1,
		borderBottomColor:
			theme.colorScheme === "dark" ? theme.white : theme.colors[theme.primaryColor][5],
		backgroundColor: theme.fn.lighten(
			theme.fn.variant({ variant: "filled", color: theme.primaryColor }).background!, 0.1),
	},

	reducedMenu: {
		alignSelf: "stretch",
		display: "flex",
		alignItems: "end",
		[theme.fn.largerThan(HEADER_SM)]: {
			display: "none",
		},
	},

	subLink: {
		width: "100%",
		padding: `${theme.spacing.xs}px`,
		borderRadius: theme.radius.md,

		...theme.fn.hover({
			backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[0],
		}),

		"&:active": theme.activeStyles,
	},

	user: {
		color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
		padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
		borderRadius: theme.radius.sm,
		transition: "background-color 100ms ease",

		"&:hover": {
			backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
		},

		[theme.fn.smallerThan("xs")]: {
			display: "none",
		},
	},

	userActive: {
		backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
	},
}));

interface MainLinkProps {
	label: string;
	path: string;
	minLevel?: number,
}

interface UserLinkProps {
	label: string;
	link?: string;
	action?: () => void;
}

interface MainHeaderProps {
	mainLinks: MainLinkProps[];
	userLinks: UserLinkProps[];
}

const isMainLinkActive = (item: MainLinkProps): boolean => {
	const resolved = useResolvedPath(item.path);
	return !!useMatch({ path: resolved.pathname, end: false });
};

export default function MainHeader({ mainLinks, userLinks }: MainHeaderProps) {
	const { classes, theme, cx } = useStyles();

	const mainItems = mainLinks.map((item) => (
		<AuthdSection key={item.label} minLevel={item.minLevel}>
			<Anchor
				component={Link}
				to={item.path}
				className={cx(classes.mainLink, { [classes.mainLinkActive]: isMainLinkActive(item) })}
			>
				{item.label}
			</Anchor>
		</AuthdSection>
	));

	const secondaryItems = userLinks.map((item) => (
		<Anchor<"a">
			href={item.link}
			onClick={item.action}
			key={item.label}
			className={classes.secondaryLink}
			target={item.link ? "_blank" : undefined}
		>
			{item.label}
		</Anchor>
	));

	const activeMainLink = mainLinks.find((item) => isMainLinkActive(item));

	const reducedMenu = (
		<HoverCard width={280} position="bottom" radius="md" shadow="md" withinPortal>
			<HoverCard.Target>
				<a href="#" className={cx(classes.mainLink, classes.mainLinkActive)}>
					<Center inline>
						{activeMainLink &&
							<Box component="span" mr={5}>
								{activeMainLink.label}
							</Box>}
						<IconChevronDown size={16} color={theme.white} />
					</Center>
				</a>
			</HoverCard.Target>

			<HoverCard.Dropdown sx={{ overflow: "hidden" }}>
				<Flex>
					<Stack spacing={0}>
						{userLinks.map((link) => (
							<AuthdSection key={link.label}>
								<UnstyledButton className={classes.subLink} key={link.label}>
									<Anchor<"a">
										href={link.link}
										onClick={link.action}
										key={link.label}
										target={link.link ? "_blank" : undefined}
									>
										<Text size="xs">
											{link.label}
										</Text>
									</Anchor>
								</UnstyledButton>
							</AuthdSection>
						))}
					</Stack>
					<Stack spacing={0}>
						{mainLinks.map((link) => (
							<AuthdSection key={link.label} minLevel={link.minLevel}>
								<UnstyledButton className={classes.subLink} key={link.label}>
									<Anchor
										component={Link}
										to={link.path}
									>
										<Text size="sm" weight={500}>
											{link.label}
										</Text>
									</Anchor>
								</UnstyledButton>
							</AuthdSection>
						))}
					</Stack>
				</Flex>
			</HoverCard.Dropdown>
		</HoverCard>
	);

	return (
		<Header height={HEADER_HEIGHT} className={classes.header}>
			<Container className={classes.inner}>
				<NetshotLogo variant="white" width={250} />

				<div className={classes.links}>
					<Group position="right">{secondaryItems}</Group>
					<Group spacing={0} position="right" className={classes.mainLinks}>
						{mainItems}
					</Group>
				</div>

				<div className={classes.reducedMenu}>
					{reducedMenu}
				</div>

			</Container>
		</Header>
	);
}
