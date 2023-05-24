import React from "react";
import { MantineProvider, createStyles, Container } from "@mantine/core";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import relativeTime from "dayjs/plugin/relativeTime";
import weekDay from "dayjs/plugin/weekday";

import { AdminPage } from "./admin";
import { DevicePage } from "./devices";
import { HomePage } from "./home";
import { NotFoundPage } from "./NotFoundPage";
import LoginPage from "./LoginPage";
import AuthProvider, { AuthLevelRequired, UserLevel } from "./AuthProvider";
import { TaskPage } from "./tasks";
import { ReportPage } from "./reports";
import { MainLayout } from "./MainLayout";

dayjs.extend(calendar);
dayjs.extend(relativeTime);
dayjs.extend(weekDay);

export const useStyles = createStyles((theme, _params, getRef) => ({
	main: {
		height: "100vh",
		display: "flex",
		flexDirection: "column",
	},
	container: {
		flex: "1 1 100%",
		overflow: "hidden",
	},
}));

function App() {
	const { classes } = useStyles();

	return (
		<BrowserRouter>
			<MantineProvider withNormalizeCSS withGlobalStyles>
				<Notifications position="top-right" />
				<ModalsProvider>
					<AuthProvider>
						<div className={classes.main}>
							<Routes>
								<Route path="reports/*" element={<ReportPage />} />
								<Route path="tasks/*" element={<TaskPage />} />
								<Route path="admin/*" element={<AdminPage />} />
								<Route element={
									<AuthLevelRequired level={UserLevel.READONLY}>
										<MainLayout>
											<Outlet />
										</MainLayout>
									</AuthLevelRequired>
								}>
									<Route path="devices/*" element={<DevicePage />} />
									<Route path="home" element={<HomePage />} />
									<Route index element={<Navigate to="/home" replace />} />
								</Route>
								<Route path="login" element={<LoginPage />} />
								<Route path="*" element={<NotFoundPage />} />
							</Routes>
						</div>
					</AuthProvider>
				</ModalsProvider>
			</MantineProvider>
		</BrowserRouter>
	);
}

export default App;
