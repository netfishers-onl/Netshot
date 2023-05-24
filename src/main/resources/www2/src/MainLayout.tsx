import React from "react";
import { AppShell, createStyles, Navbar } from "@mantine/core";
import MainHeader from "./MainHeader";
import { UserLevel } from "./AuthProvider";
import { useDisclosure } from "@mantine/hooks";
import AboutModal from './AboutModal';
import { CurrentUserModal } from "./CurrentUserModal";
import { SectionLink, SectionLinkProps } from "./common/SectionLink";

const useStyles = createStyles((theme, _params, getRef) => {
	return {
		navbar: {
			backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
		},
	};
});


export function MainLayout({ sectionLinks, children }: { sectionLinks?: Array<SectionLinkProps>, children: JSX.Element }) {
	const [userModalOpened, toggleUserModal] = useDisclosure(false);
	const [aboutModalOpened, toggleAboutModal] = useDisclosure(false);
	const { classes } = useStyles();

	const mainLinks = [{
		label: "Home",
		path: "/home",
	}, {
		label: "Devices",
		path: "/devices",
	}, {
		label: "Compliance",
		path: "/compliance",
	}, {
		label: "Diagnostics",
		path: "/diagnostics",
	}, {
		label: "Reports",
		path: "/reports",
	}, {
		label: "Tasks",
		path: "/tasks",
	}, {
		label: "Admin",
		path: "/admin",
		minLevel: UserLevel.ADMIN,
	}];

	const userLinks = [{
		label: "About",
		action: toggleAboutModal.open,
	}, {
		label: "Help",
		link: "https://github.com/netfishers-onl/Netshot/wiki",
	}, {
		label: "API",
		link: "/api-browser/",
	}, {
		label: "Account",
		action: toggleUserModal.open,
	}];

	const navbar = sectionLinks ? (
		<Navbar className={classes.navbar} width={{ base: 50, sm: 250 }}>
			<Navbar.Section grow mt="xl">
				{sectionLinks.map((link) => (
					<SectionLink key={link.label} sectionLink={link} />
				))}
			</Navbar.Section>
		</Navbar>
	) : undefined;

	return (
		<>
			<AppShell
				header={<MainHeader mainLinks={mainLinks} userLinks={userLinks} />}
				navbar={navbar}
			>
				{children}
			</AppShell>
			<CurrentUserModal
				opened={userModalOpened}
				onClose={toggleUserModal.close} />
			<AboutModal
				opened={aboutModalOpened}
				onClose={toggleAboutModal.close} />
		</>
	);
}
