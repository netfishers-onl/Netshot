import { createStyles, ScrollArea } from "@mantine/core";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { SectionLinkProps } from "../common/SectionLink";
import ExportSection from "./ExportSection";
import { AuthLevelRequired, UserLevel } from "../AuthProvider";
import { MainLayout } from "../MainLayout";
import { IconExchange, IconTableExport } from "@tabler/icons-react";
import ConfigChangesSection from "./ConfigChangesSection";

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
	{ label: "Config changes", link: "/reports/changes", icon: IconExchange },
	{ label: "Data export", link: "/reports/export", icon: IconTableExport },
];

export function ReportPage() {
	const { classes } = useStyles();

	return (
		<Routes>
			<Route element={(
				<AuthLevelRequired level={UserLevel.READONLY}>
					<MainLayout sectionLinks={sectionLinks}>
						<ScrollArea className={classes.scrollArea}>
							<Outlet />
						</ScrollArea>
					</MainLayout>
				</AuthLevelRequired>
			)}>
				<Route path="changes" element={<ConfigChangesSection />} />
				<Route path="export" element={<ExportSection />} />
				<Route index element={<Navigate to="/reports/changes" replace />} />
			</Route>
		</Routes>
	);
}
