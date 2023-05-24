import { createStyles, ScrollArea } from "@mantine/core";
import UserSection from "./UserSection";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import DomainSection from "./DomainSection";
import DriverSection from "./DriverSection";
import CredentialSetSection from "./CredentialSetSection";
import ClusteringSection from "./ClusteringSection";
import HookSection from "./HookSection";
import { SectionLinkProps } from "../common/SectionLink";
import { AuthLevelRequired, UserLevel } from "../AuthProvider";
import { MainLayout } from "../MainLayout";
import { IconActivityHeartbeat, IconAtom2, IconKey, IconSteeringWheel, IconUsers, IconWebhook } from "@tabler/icons-react";

const useStyles = createStyles(() => {
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
	};
});

const sectionLinks: Array<SectionLinkProps> = [
	{ label: "Users and API tokens", link: "/admin/users", icon: IconUsers },
	{ label: "Device domains", link: "/admin/domains", icon: IconAtom2 },
	{ label: "Device credentials", link: "/admin/credentials", icon: IconKey },
	{ label: "Hooks", link: "/admin/hooks", icon: IconWebhook },
	{ label: "Device drivers", link: "/admin/drivers", icon: IconSteeringWheel },
	{ label: "Clustering", link: "/admin/cluster", icon: IconActivityHeartbeat },
];

export function AdminPage() {
	const { classes } = useStyles();

	return (
		<Routes>
			<Route element={
				<AuthLevelRequired level={UserLevel.ADMIN}>
					<MainLayout sectionLinks={sectionLinks}>
						<ScrollArea className={classes.scrollArea}>
							<Outlet />
						</ScrollArea>
					</MainLayout>
				</AuthLevelRequired>
			}>
				<Route path="users" element={<UserSection />} />
				<Route path="domains" element={<DomainSection />} />
				<Route path="credentials" element={<CredentialSetSection />} />
				<Route path="hooks" element={<HookSection />} />
				<Route path="drivers" element={<DriverSection />} />
				<Route path="cluster" element={<ClusteringSection />} />
				<Route index element={<Navigate to="/admin/users" replace />} />
			</Route>
		</Routes>
	);
}