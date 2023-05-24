import { ActionIcon, Alert, Button, Container, createStyles, Group, Loader, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconEdit, IconHelp, IconTrash } from "@tabler/icons-react";
import React, { useCallback, useEffect, useState } from "react";
import { RsDomainRestApiView } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { DeleteDomainModal } from "./DeleteDomainModal";
import { EditDomainModal } from "./EditDomainModal";

const useStyles = createStyles((theme) => ({
	ip: {
		fontFamily: theme.fontFamilyMonospace,
	},
}));

export default function DomainSection() {
	const { classes } = useStyles();
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [domains, setDomains] = useState<Array<RsDomainRestApiView>>([]);
	const [editingDomain, setEditingDomain] = useState<RsDomainRestApiView | null | undefined>();
	const [deletingDomain, setDeletingDomain] = useState<RsDomainRestApiView | null | undefined>();

	const fetchDomains = useCallback(async () => {
		try {
			setDomains((await Api.admin.getDomains()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		fetchDomains();
	}, [fetchDomains, lastFetch]);

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Device domains</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Administration#device-domains"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left" mt="md">
				<Button variant="outline" compact onClick={() => setEditingDomain(null)}>New domain...</Button>
			</Group>
			{status === LoadStatus.ERROR ? (
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>
			) : (
				<Table verticalSpacing="xs" highlightOnHover mt="md">
					<thead>
						<tr><th>Name</th><th>Description</th><th>Server Address</th><th> </th></tr>
					</thead>
					<tbody>
						{status === LoadStatus.LOADING &&
							<tr><td colSpan={4}><Group position="center"><Loader size="sm" /></Group></td></tr>}
						{status === LoadStatus.DONE && domains.map((domain) => (
							<tr key={domain.id}>
								<td><Text>{domain.name}</Text></td>
								<td><Text>{domain.description}</Text></td>
								<td><Text className={classes.ip}>{domain.ipAddress}</Text></td>
								<td>
									<Group spacing={5} position="right">
										<ActionIcon
											variant="outline"
											title="Edit"
											onClick={() => setEditingDomain(domain)}
										>
											<IconEdit size={14} />
										</ActionIcon>
										<ActionIcon
											variant="outline"
											color="red"
											title="Delete"
											onClick={() => setDeletingDomain(domain)}
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
			<EditDomainModal
				domain={editingDomain}
				opened={editingDomain !== undefined}
				onClose={() => setEditingDomain(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
			<DeleteDomainModal
				domain={deletingDomain}
				opened={deletingDomain !== undefined}
				onClose={() => setDeletingDomain(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
		</Container>
	);
}
