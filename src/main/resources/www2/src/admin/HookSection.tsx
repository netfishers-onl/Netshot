import { ActionIcon, Alert, Badge, Button, Container, createStyles, Group, Loader, Table, Text, ThemeIcon, Title } from "@mantine/core";
import { IconAlertCircle, IconBellOff, IconEdit, IconHelp, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { HookRestApiView, WebHook } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { DeleteHookModal } from "./DeleteHookModal";
import { EditHookModal } from "./EditHookModal";

const useStyles = createStyles((theme) => ({
	table: {
		"& td": {
			whiteSpace: "nowrap",
			width: 1,
		}
	},
	urlColumn: {
		width: "100%",
	},
	url: {
		fontFamily: theme.fontFamilyMonospace,
		fontSize: "0.95em",
	},
	buttonGroup: {
		width: 64,
	}
}));

export default function HookSection() {
	const { classes } = useStyles();
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [hooks, setHooks] = useState<Array<HookRestApiView>>([]);
	const [editingHook, setEditingHook] = useState<HookRestApiView | null | undefined>();
	const [deletingHook, setDeletingHook] = useState<HookRestApiView | null | undefined>();

	const fetchHooks = useCallback(async () => {
		try {
			setHooks((await Api.admin.getHooks()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		fetchHooks();
	}, [fetchHooks, lastFetch]);

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Hooks</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/Web-hooks"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left" mt="md">
				<Button variant="outline" compact onClick={() => setEditingHook(null)}>New hook...</Button>
			</Group>
			{status === LoadStatus.ERROR ? (
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>
			) : (
				<Table verticalSpacing="xs" highlightOnHover mt="md" className={classes.table}>
					<thead>
						<tr><th>Name</th><th></th><th>Type</th><th>URL</th><th></th></tr>
					</thead>
					<tbody>
						{status === LoadStatus.LOADING &&
							<tr><td colSpan={5}><Group position="center"><Loader size="sm" /></Group></td></tr>}
						{status === LoadStatus.DONE && hooks.map((hook) => (
							<tr key={hook.id}>
								<td><Text>{hook.name}</Text></td>
								<td>
									{!hook.enabled && (
										<ThemeIcon title="Disabled" color="gray" variant="light" radius="xl">
											<IconBellOff size={18} />
										</ThemeIcon>
									)}
								</td>
								<td><Text><Badge>{hook.type}</Badge></Text></td>
								<td className={classes.urlColumn}>
									<Text className={classes.url} lineClamp={1}>{(hook as WebHook).url}</Text>
								</td>
								<td>
									<Group spacing={5} position="right" className={classes.buttonGroup}>
										<ActionIcon
											variant="outline"
											title="Edit"
											onClick={() => setEditingHook(hook)}
										>
											<IconEdit size={14} />
										</ActionIcon>
										<ActionIcon
											variant="outline"
											color="red"
											title="Delete"
											onClick={() => setDeletingHook(hook)}
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
			<EditHookModal
				hook={editingHook}
				opened={editingHook !== undefined}
				onClose={() => setEditingHook(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
			<DeleteHookModal
				hook={deletingHook}
				opened={deletingHook !== undefined}
				onClose={() => setDeletingHook(undefined)}
				onRefresh={() => setLastFetch(Date.now())}
			/>
		</Container>
	);
}