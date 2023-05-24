import { ActionIcon, Alert, Badge, Button, Group, Loader, Table, Text, Title } from "@mantine/core";
import { IconAlertCircle, IconEdit, IconHelp, IconTrash } from "@tabler/icons-react";
import React, { useCallback, useEffect, useState } from "react";
import { RsUserRestApiView } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { UserLevelDescs } from "../AuthProvider";
import { DeleteUserModal } from "./DeleteUserModal";
import { EditUserModal } from "./EditUserModal";

export default function UserList() {
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [users, setUsers] = useState<Array<RsUserRestApiView>>([]);
	const [editingUser, setEditingUser] = useState<RsUserRestApiView | null | undefined>();
	const [deletingUser, setDeletingUser] = useState<RsUserRestApiView | null | undefined>();

	const fetchUsers = useCallback(async () => {
		try {
			setUsers((await Api.admin.getUsers()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers, lastFetch]);

	return (
		<>
			<Group position="apart" mt="xl">
				<Title order={3}>Users</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Administration#authentication"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left" mt="md">
				<Button variant="outline" compact onClick={() => setEditingUser(null)}>New user...</Button>
			</Group>
			{status === LoadStatus.ERROR ? (
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>
			) : (
				<Table verticalSpacing="xs" highlightOnHover mt="md">
					<thead>
						<tr><th>Name</th><th>Type</th><th>Permission</th><th></th></tr>
					</thead>
					<tbody>
						{status === LoadStatus.LOADING &&
							<tr><td colSpan={4}><Group position="center"><Loader size="sm" /></Group></td></tr>}
						{status === LoadStatus.DONE && users.map((user) => (
							<tr key={user.id}>
								<td><Text>{user.username}</Text></td>
								<td>
									{user.local ?
										<Badge>Local user</Badge> :
										<Badge color="cyan">Remote user</Badge>}
								</td>
								<td>
									<Badge color="green" variant="filled">
										{UserLevelDescs.find(l => user.level && l[2] >= user.level)?.[0]}
									</Badge>
								</td>
								<td>
									<Group spacing={5} position="right">
										<ActionIcon
											variant="outline"
											title="Edit"
											onClick={() => setEditingUser(user)}
										>
											<IconEdit size={14} />
										</ActionIcon>
										<ActionIcon
											variant="outline"
											color="red"
											title="Delete"
											onClick={() => setDeletingUser(user)}
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
			<EditUserModal
				user={editingUser}
				opened={editingUser !== undefined}
				onClose={() => setEditingUser(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
			<DeleteUserModal
				user={deletingUser}
				opened={deletingUser !== undefined}
				onClose={() => setDeletingUser(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
		</>
	);
}