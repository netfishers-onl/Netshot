import { ActionIcon, Alert, Button, Container, createStyles, Group, Loader, Table, Text, ThemeIcon, Title } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconDots, IconHelp, IconPackageImport, IconX } from "@tabler/icons-react";
import { AxiosError } from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { DeviceDriverRestApiView } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { DriverModal } from "./DriverModal";

const useStyles = createStyles((theme) => ({
	hash: {
		fontFamily: theme.fontFamilyMonospace,
	},
}));

export default function DriverSection() {
	const { classes } = useStyles();

	const [status, setStatus] = useState<LoadStatus>(LoadStatus.INIT);
	const [drivers, setDrivers] = useState<Array<DeviceDriverRestApiView>>([]);
	const [reloading, toggleReloading] = useToggle();
	const [selectedDriver, setSelectedDriver] = useState<DeviceDriverRestApiView>();

	const fetchDrivers = useCallback(async () => {
		try {
			setDrivers((await Api.admin.getDeviceTypes()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		setStatus(LoadStatus.LOADING);
		fetchDrivers();
	}, [fetchDrivers]);

	const handleReload = useCallback(async () => {
		toggleReloading(true);
		try {
			setDrivers((await Api.admin.getDeviceTypes(true)).data);
			showNotification({
				id: "admin-domain-reload",
				autoClose: 5000,
				title: "Driver reload",
				message: "Drivers have been successfully reloaded.",
				color: "green",
				icon: <IconCheck size={18} />,
			});
		}
		catch (error: unknown) {
			let message =  "Unable to reload the drivers.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while reloading the drivers: ${error.response.data.errorMsg}`
			}
			showNotification({
				id: "admin-domain-reload",
				autoClose: 5000,
				title: "Driver reload",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
		toggleReloading(false);
	}, [toggleReloading]);

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Device drivers</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Administration#device-types"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left">
				<Button mt="md" variant="outline" color="orange" compact onClick={handleReload} loading={reloading}>
					Reload the drivers
				</Button>
			</Group>
			{status === LoadStatus.ERROR ? (
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>
			) : (
				<Table verticalSpacing={5} highlightOnHover mt="md">
					<thead>
						<tr><th></th><th>Driver</th><th>Version</th><th>Hash</th><th></th></tr>
					</thead>
					<tbody>
						{status === LoadStatus.LOADING &&
							<tr><td colSpan={5}><Group position="center"><Loader size="sm" /></Group></td></tr>}
						{status === LoadStatus.DONE && drivers.map((driver) => (
							<tr key={driver.name}>
								<td>
									{driver.location?.type === "FILE" && (
										<ThemeIcon title="External file" color="gray" variant="light" radius="xl">
											<IconPackageImport size={18} />
										</ThemeIcon>
									)}
								</td>
								<td><Text>{driver.description}</Text></td>
								<td><Text>{driver.version}</Text></td>
								<td><Text className={classes.hash}>{driver.sourceHash?.substring(0, 6)}</Text></td>
								<td>
									<Group spacing={5} position="right">
										<ActionIcon
											variant="outline"
											title="Show details"
											onClick={() => setSelectedDriver(driver)}
										>
											<IconDots size={14} />
										</ActionIcon>
									</Group>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}
			<DriverModal
				opened={!!selectedDriver}
				driver={selectedDriver}
				onClose={() => setSelectedDriver(undefined)}
			/>
		</Container>
	);
}