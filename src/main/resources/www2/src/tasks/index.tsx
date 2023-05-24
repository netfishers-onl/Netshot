import React from "react";
import { AppShell, Button, createStyles, Divider, Group, Navbar, ScrollArea } from "@mantine/core";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import SearchSection from "./SearchSection";
import { SectionLink, SectionLinkProps } from "../common/SectionLink";
import { AuthLevelRequired, UserLevel } from "../AuthProvider";
import { MainLayout } from "../MainLayout";
import { IconAsterisk, IconCalendarEvent, IconCheck, IconFileUnknown, IconHandStop, IconHourglass, IconLayoutDashboard, IconListSearch, IconPlayerPlay, IconX, TablerIcon, TablerIconProps } from "@tabler/icons-react";
import { TaskRestApiViewStatusEnum } from "../api";
import CurrentSection from "./CurrentSection";

const useStyles = createStyles((theme) => {
	return {
		page: {
			flex: "1 1 100%",
			alignSelf: "flex-end",
			height: "100%",
		},

		body: {
			height: "100%",
		},

		scrollArea: {
			height: "100%",
		},

		navbar: {
			width: 250,
			backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,
		},
	};
});

const sectionLinks: Array<SectionLinkProps> = [
	{ label: "Current tasks", link: "/tasks/current", icon: IconLayoutDashboard },
	{ label: "Search old tasks", link: "/tasks/search", icon: IconListSearch },
];

export function TaskPage() {
	const { classes } = useStyles();

	return (
		<Routes>
			<Route element={
				<AuthLevelRequired level={UserLevel.READONLY}>
					<MainLayout sectionLinks={sectionLinks}>
						<ScrollArea className={classes.scrollArea}>
							<Outlet />
						</ScrollArea>
					</MainLayout>
				</AuthLevelRequired>
			}>
				<Route path="current" element={<CurrentSection />} />
				<Route path="search" element={<SearchSection />} />
				<Route index element={<Navigate to="/tasks/current" replace />} />
			</Route>
		</Routes>
	);
}
