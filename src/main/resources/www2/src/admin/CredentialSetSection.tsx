import { ActionIcon, Alert, Badge, Button, Container, Group, Loader, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconEdit, IconHelp, IconTrash } from "@tabler/icons-react";
import React, { useCallback, useEffect, useState } from "react";
import { DeviceCredentialSetRestApiView } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { DeleteCredentialSetModal } from "./DeleteCredentialSetModal";
import { EditCredentialSetModal } from "./EditCredentialSetModal";

export default function CredentialSetSection() {
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [credentialsets, setCredentialSets] = useState<Array<DeviceCredentialSetRestApiView>>([]);
	const [editingCredentialSet, setEditingCredentialSet] = useState<DeviceCredentialSetRestApiView | null | undefined>();
	const [deletingCredentialSet, setDeletingCredentialSet] = useState<DeviceCredentialSetRestApiView | null | undefined>();

	const fetchCredentialSets = useCallback(async () => {
		try {
			setCredentialSets((await Api.admin.getCredentialSets()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		fetchCredentialSets();
	}, [fetchCredentialSets, lastFetch]);

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Credential sets</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Administration#device-credentials"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left" mt="md">
				<Button variant="outline" compact onClick={() => setEditingCredentialSet(null)}>New credentials...</Button>
			</Group>
			{status === LoadStatus.ERROR ? (
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>
				) : (
					<Table verticalSpacing="xs" highlightOnHover mt="md">
						<thead>
							<tr>
								<th>Name</th>
								<th>Type</th>
								<th>Domain</th>
								<th> </th>
							</tr>
						</thead>
						<tbody>
							{status === LoadStatus.LOADING &&
								<tr><td colSpan={4}><Group position="center"><Loader size="sm" /></Group></td></tr>}
							{status === LoadStatus.DONE && credentialsets.map((credentialSet) => (
								<tr key={credentialSet.id}>
									<td><Text>{credentialSet.name}</Text></td>
									<td><Badge>{credentialSet.type}</Badge></td>
									<td><Text>{credentialSet.mgmtDomain?.name || "Any"}</Text></td>
									<td>
										<Group spacing={5} position="right">
											<ActionIcon
												variant="outline"
												title="Edit"
												onClick={() => setEditingCredentialSet(credentialSet)}
											>
												<IconEdit size={14} />
											</ActionIcon>
											<ActionIcon
												variant="outline"
												color="red"
												title="Delete"
												onClick={() => setDeletingCredentialSet(credentialSet)}
											>
												<IconTrash size={14} />
											</ActionIcon>
										</Group>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				)}
			<EditCredentialSetModal
				credentialSet={editingCredentialSet}
				opened={editingCredentialSet !== undefined}
				onClose={() => setEditingCredentialSet(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
			<DeleteCredentialSetModal
				credentialSet={deletingCredentialSet}
				opened={deletingCredentialSet !== undefined}
				onClose={() => setDeletingCredentialSet(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
		</Container>
	);
}
