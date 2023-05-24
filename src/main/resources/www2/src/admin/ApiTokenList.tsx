import { ActionIcon, Alert, Badge, Button, Group, Loader, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconHelp, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { RsApiTokenRestApiView } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { UserLevelDescs } from "../AuthProvider";
import { AddApiTokenModal } from "./AddApiTokenModal";
import { DeleteApiTokenModal } from "./DeleteApiTokenModal";

export default function ApiTokenList() {
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [apiTokens, setApiTokens] = useState<Array<RsApiTokenRestApiView>>([]);
	const [editedApiToken, setEditedApiToken] = useState<RsApiTokenRestApiView | null | undefined>(undefined);
	const [deletingApiToken, setDeletingApiToken] = useState<RsApiTokenRestApiView | null | undefined>(undefined);

	const fetchApiTokens = useCallback(async () => {
		try {
			setApiTokens((await Api.admin.getApiTokens()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		fetchApiTokens();
	}, [fetchApiTokens, lastFetch]);

	return (
		<>
			<Group position="apart" mt="xl">
				<Title order={3}>API Tokens</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Administration#api-tokens"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left" mt="md">
				<Button variant="outline" compact onClick={() => setEditedApiToken(null)}>New token...</Button>
			</Group>
			{status === LoadStatus.ERROR ?
				(
					<Alert icon={(<IconAlertCircle size={16} />)} title="Data error" color="red" mt="md">
						Unable to load data from the server.
					</Alert>
				) : (
					<Table verticalSpacing="xs" highlightOnHover mt="md">
						<thead>
							<tr>
								<th>Description</th>
								<th>Permission</th>
								<th> </th>
							</tr>
						</thead>
						<tbody>
							{status === LoadStatus.LOADING &&
								<tr><td colSpan={100}><Group position="center"><Loader size="sm" /></Group></td></tr>}
							{status === LoadStatus.DONE && apiTokens.map((apiToken) => (
								<tr key={apiToken.id}>
									<td><Text>{apiToken.description}</Text></td>
									<td>
										<Badge color="green" variant="filled">
											{UserLevelDescs.find((l) => apiToken.level && l[2] >= apiToken.level)?.[0]}
										</Badge>
									</td>
									<td>
										<Group spacing={5} position="right">
											<ActionIcon
												variant="outline"
												color="red"
												title="Delete"
												onClick={() => setDeletingApiToken(apiToken)}
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
			<AddApiTokenModal
				opened={editedApiToken !== undefined}
				onClose={() => setEditedApiToken(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
			<DeleteApiTokenModal
				token={deletingApiToken}
				opened={deletingApiToken !== undefined}
				onClose={() => setDeletingApiToken(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
		</>
	);
}
