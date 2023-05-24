import { ActionIcon, Alert, Button, Container, createStyles, Group, Loader, Paper, Progress, SimpleGrid, Space, Text, Title, Tooltip } from "@mantine/core";
import { IconAlertCircle, IconCalendarEvent, IconCheck, IconHelp, IconHourglass, IconPlayerPlay, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { RsTaskSummaryRestApiView, TaskRestApiViewStatusEnum } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { TaskList, TaskStatusIcon } from "./TaskList";

const useStyles = createStyles((theme) => ({
	icon: {
		color: theme.colorScheme === "dark" ? theme.colors.dark[3] : theme.colors.gray[4],
	},
}));

export default function CurrentSection() {
	const { classes } = useStyles();
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [taskSummary, setTaskSummary] = useState<RsTaskSummaryRestApiView>();

	const fetchSummary = useCallback(async () => {
		try {
			setTaskSummary((await Api.tasks.getTaskSummary()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		fetchSummary();
	}, [fetchSummary, lastFetch]);

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Task overview</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Tasks"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left" mt="md">
				<Button variant="outline" color="orange" compact onClick={() => setLastFetch(Date.now())}>Refresh</Button>
			</Group>
			{status === LoadStatus.LOADING &&
				<Group position="center"><Loader /></Group>}
			{status === LoadStatus.ERROR &&
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>}
			{status === LoadStatus.DONE && taskSummary && 
				<SimpleGrid cols={3}>
					<Paper withBorder radius="md" mt="md" p="sm">
						<div>
							<Text color="dimmed" size="xs" transform="uppercase" weight={700}>
								scheduled task{(taskSummary.countByStatus?.SCHEDULED || 0) > 1 ? "s" : ""}
							</Text>
							<Group position="apart">
								<Text weight={700} size="xl">
									{taskSummary.countByStatus?.SCHEDULED || 0}
								</Text>
								<TaskStatusIcon status={TaskRestApiViewStatusEnum.Scheduled} />
							</Group>
						</div>
					</Paper>
					<Paper withBorder radius="md" mt="md" p="sm">
						<div>
							<Text color="dimmed" size="xs" transform="uppercase" weight={700}>
								running task{(taskSummary.countByStatus?.RUNNING || 0) > 1 ? "s" : ""}
							</Text>
							<Group position="apart">
								<Text weight={700} size="xl">
									{taskSummary.countByStatus?.RUNNING || 0}
								</Text>
								<TaskStatusIcon status={TaskRestApiViewStatusEnum.Running} />
							</Group>
						</div>
						<Tooltip label="Running tasks vs Thread count">
							<Progress
								mt="md"
								size="xl"
								radius="xl"
								value={100 * (taskSummary.countByStatus?.RUNNING || 0) / (taskSummary.threadCount ?? 10)}
								label={`${String(taskSummary.countByStatus?.RUNNING || 0)} / ${taskSummary.threadCount ?? 10}`}
							/>
						</Tooltip>
					</Paper>
					<Paper withBorder radius="md" mt="md" p="sm">
						<div>
							<Text color="dimmed" size="xs" transform="uppercase" weight={700}>
								waiting task{(taskSummary.countByStatus?.WAITING || 0) > 1 ? "s" : ""}
							</Text>
							<Group position="apart">
								<Text weight={700} size="xl">
									{taskSummary.countByStatus?.WAITING || 0}
								</Text>
								<TaskStatusIcon status={TaskRestApiViewStatusEnum.Waiting} />
							</Group>
						</div>
					</Paper>
				</SimpleGrid>}
			<Title order={4} mt="xl">Running and pending tasks</Title>
			<TaskList
				filter={{
					statuses: new Set([
						TaskRestApiViewStatusEnum.Scheduled,
						TaskRestApiViewStatusEnum.Running,
						TaskRestApiViewStatusEnum.Waiting,
					]),
					before: null,
					after: null,
				}}
				fetchSerial={lastFetch}
			/>
		</Container>
	);
}