import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, createStyles, Group, Loader, Modal, ModalProps, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core";
import { DiscoverDeviceTypeTask, TakeSnapshotTask, TaskRestApiView, TaskRestApiViewStatusEnum } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { TaskDateText, TaskRepeatingText, TaskStatusIcon } from "./TaskList";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

const useStyles = createStyles((theme) => ({
	runnerId: {
		fontFamily: theme.fontFamilyMonospace,
		fontSize: "0.9em",
	},
	logArea: {
		maxHeight: 200,
	},
	logText: {
		fontFamily: theme.fontFamilyMonospace,
		fontSize: "0.8em",
		whiteSpace: "pre-wrap",
	},
}));

interface TaskModalProps extends ModalProps {
	taskId?: number,
	onUpdate: (task: TaskRestApiView) => void,
}

export function TaskModal({ taskId, onUpdate, opened, onClose, ...rest }: TaskModalProps) {
	const { classes } = useStyles();
	const [, setSearchParam] = useSearchParams();
	const [task, setTask] = useState<TaskRestApiView>();
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);

	const fetchTask = useCallback(async (id: number) => {
		try {
			setTask((await Api.tasks.getTask(id)).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		if (opened) {
			if (typeof taskId === "number") {
				fetchTask(taskId);
			}
			else {
				setTask(undefined);
			}
		}
	}, [taskId, fetchTask, opened]);

	return (
		<Modal
			title={(
				<Text color="dimmed">
					Task #{taskId}
					{task?.runnerId &&
						<> [runner <Text component="span" className={classes.runnerId}>{task.runnerId}</Text>]</>}
				</Text>
			)}
			opened={opened}
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			{status === LoadStatus.LOADING && (
				<Group m="xl"><Loader /></Group>
			)}
			{status === LoadStatus.DONE && task && (
				<>
					<Group position="apart">
						<div>
							<Text size="xl" weight={700}>{task.taskDescription}</Text>
							<Text size="md" weight={700}>{task.target}</Text>
							<Box mt="sm">
								<Text size="xs" color="dimmed">Comments</Text>
								<Text>{task.comments || "-"}</Text>
							</Box>
						</div>
						<Stack align="center" spacing={2}>
							<TaskStatusIcon status={task.status} size={64} iconSize={48} radius={32} />
							<Text>{task.status?.toLowerCase().replace(/^(.)/, (a, l) => l.toUpperCase())}</Text>
						</Stack>
					</Group>
					<SimpleGrid cols={3}>
						<div>
							<Text size="xs" color="dimmed">Creation time</Text>
							<Text>{dayjs(task.creationDate).format("YYYY-MM-DD HH:mm")}</Text>
						</div>
						<div>
							<Text size="xs" color="dimmed">Execution time</Text>
							<Text><TaskDateText task={task} /></Text>
						</div>
						<div>
							<Text size="xs" color="dimmed">Repeating</Text>
							<Text><TaskRepeatingText task={task} /></Text>
						</div>
					</SimpleGrid>
					{(task.status === TaskRestApiViewStatusEnum.Success && task.type === ".DiscoverDeviceTypeTask") &&
						<SimpleGrid cols={3}>
							<div>
								<Text size="xs" color="dimmed">Discovered Type</Text>
								<Text>{(task as DiscoverDeviceTypeTask).discoveredDeviceTypeDescription}</Text>
							</div>
							<div>
								<Text size="xs" color="dimmed">Snapshot task</Text>
								<Button
									variant="subtle"
									compact
									onClick={() => setSearchParam({ task: String((task as DiscoverDeviceTypeTask).snapshotTaskId) })}
								>
									Show
								</Button>
							</div>
						</SimpleGrid>}
					{(task.status === TaskRestApiViewStatusEnum.Success && task.type === ".TakeSnapshotTask") &&
						<SimpleGrid cols={3}>
							<div>
								<Text size="xs" color="dimmed">Device</Text>
								<Button variant="subtle" compact>{(task as TakeSnapshotTask).target}</Button>
							</div>
						</SimpleGrid>}
					{task.log &&
						<Box mt="sm">
							<Text size="xs" color="dimmed">Logs</Text>
							<ScrollArea classNames={{ viewport: classes.logArea }}>
								<Text className={classes.logText}>{task.log}</Text>
							</ScrollArea>
						</Box>}
					{task.status !== TaskRestApiViewStatusEnum.Cancelled && task.debugEnabled &&
						<Box>
							<Text size="xs" color="dimmed">Debug log</Text>
							<Button variant="subtle" compact>Download</Button>
						</Box>}
				</>
			)}
		</Modal>
	);
}
