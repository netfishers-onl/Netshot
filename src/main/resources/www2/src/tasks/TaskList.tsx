import { ActionIcon, Alert, Button, Group, Loader, Table, ThemeIcon, ThemeIconProps } from "@mantine/core";
import { IconAlertCircle, IconAlertTriangle, IconCalendarEvent, IconCheck, IconFilePlus, IconHandStop, IconHeartRateMonitor, IconHourglass, IconPlayerPlay, IconPlayerStop, IconQuestionMark, IconRepeat } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RsTaskRestApiViewScheduleTypeEnum, TaskRestApiView, TaskRestApiViewStatusEnum } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { TaskModal } from "./TaskModal";

export interface SearchFilter {
	statuses: Set<TaskRestApiViewStatusEnum>;
	before: Date | null;
	after: Date | null;
}

const PAGE_SIZE = 50;


export function TaskRepeatingText({ task }: { task: TaskRestApiView }) {
	let text = "No";
	if (task.repeating) {
		const factor = task.scheduleFactor || 1;
		let unit = "?";
		if (task.scheduleType === RsTaskRestApiViewScheduleTypeEnum.Hourly) {
			unit = (factor > 1) ? "hours" : "hour";
		}
		else if (task.scheduleType === RsTaskRestApiViewScheduleTypeEnum.Daily) {
			unit = (factor > 1) ? "days" : "day";
		}
		else if (task.scheduleType === RsTaskRestApiViewScheduleTypeEnum.Weekly) {
			unit = (factor > 1) ? "weeks" : "week";
		}
		else if (task.scheduleType === RsTaskRestApiViewScheduleTypeEnum.Monthly) {
			unit = (factor > 1) ? "months" : "month";
		}
		text = `every ${factor} ${unit}`;
	}
	return (
		<>{text}</>
	);
}

export function TaskDateText({ task }: { task: TaskRestApiView }) {
	let text = "Unknown";
	let date = null;
	switch (task.status) {
	case TaskRestApiViewStatusEnum.New:
	case TaskRestApiViewStatusEnum.Waiting:
	case TaskRestApiViewStatusEnum.Scheduled:
	case TaskRestApiViewStatusEnum.Cancelled:
		date = task.nextExecutionDate;
		break;
	case TaskRestApiViewStatusEnum.Running:
	case TaskRestApiViewStatusEnum.Success:
	case TaskRestApiViewStatusEnum.Failure:
		date = task.executionDate;
		break;
	}
	if (date) {
		text = dayjs(date).format("YYYY-MM-DD HH:mm");
	}
	else {
		text = "As soon as possible";
	}

	return (
		<>{text}</>
	)
}

interface TaskStatusIconProps extends Omit<ThemeIconProps, "children"> {
	status?: TaskRestApiViewStatusEnum;
	iconSize?: string | number;
}

export function TaskStatusIcon({ status, iconSize, variant = "light", radius = "xl", ...rest }: TaskStatusIconProps) {
	const title = String(status).toLowerCase().replace(/^(.)/, (a, l) => l.toUpperCase());
	switch (status) {
	case TaskRestApiViewStatusEnum.Cancelled:
		return (
			<ThemeIcon title={title} color="gray" variant={variant} radius={radius} {...rest}>
				<IconHandStop size={iconSize} />
			</ThemeIcon>
		);
	case TaskRestApiViewStatusEnum.Failure:
		return (
			<ThemeIcon title={title} color="red" variant={variant} radius={radius} {...rest}>
				<IconAlertTriangle size={iconSize} />
			</ThemeIcon>
		);
	case TaskRestApiViewStatusEnum.New:
		return (
			<ThemeIcon title={title} color="blue" variant={variant} radius={radius} {...rest}>
				<IconFilePlus />
			</ThemeIcon>
		);
	case TaskRestApiViewStatusEnum.Running:
		return (
			<ThemeIcon title={title} color="blue" variant={variant} radius={radius} {...rest}>
				<IconPlayerPlay size={iconSize} />
			</ThemeIcon>
		);
	case TaskRestApiViewStatusEnum.Scheduled:
		return (
			<ThemeIcon title={title} color="grape" variant={variant} radius={radius} {...rest}>
				<IconCalendarEvent size={iconSize} />
			</ThemeIcon>
		);
	case TaskRestApiViewStatusEnum.Success:
		return (
			<ThemeIcon title={title} color="green" variant={variant} radius={radius} {...rest}>
				<IconCheck size={iconSize} />
			</ThemeIcon>
		);
	case TaskRestApiViewStatusEnum.Waiting:
		return (
			<ThemeIcon title={title} color="gray" variant={variant} radius={radius} {...rest}>
				<IconHourglass size={iconSize} />
			</ThemeIcon>
		);
	}
	return (
		<ThemeIcon title={title} color="dark" variant={variant} radius={radius} {...rest}>
			<IconQuestionMark size={iconSize} />
		</ThemeIcon>
	);
}

interface TaskListProps {
	filter: SearchFilter;
	fetchSerial?: number;
}

export function TaskList({ filter, fetchSerial }: TaskListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
	const [tasks, setTasks] = useState<Array<TaskRestApiView>>();
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.INIT);
	const offset = useRef<number>(0);
	const [hasMore, setHasMore] = useState<boolean>(false);

	const fetchTasks = useCallback(async (reset: boolean, taskFilter: SearchFilter) => {
		try {
			setStatus(LoadStatus.LOADING);
			let toDate = undefined;
			if (taskFilter.before) {
				toDate = dayjs(taskFilter.before).endOf("day");
			}
			const newTasks = (await Api.tasks.getTasks(reset ? 0 : offset.current, PAGE_SIZE + 1,
				taskFilter.statuses, taskFilter.after ? taskFilter.after.valueOf() : undefined, toDate ? toDate.valueOf() : undefined)).data;
			if (newTasks.length > PAGE_SIZE) {
				newTasks.pop();
				setHasMore(true);
			}
			else {
				setHasMore(false);
			}
			if (reset) {
				offset.current = PAGE_SIZE;
				setTasks(newTasks);
			}
			else {
				offset.current += PAGE_SIZE;
				setTasks(oldTasks => (oldTasks ? [...oldTasks, ...newTasks] : newTasks));
			}
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	const handleMoreClick = useCallback(async () => {
		await fetchTasks(false, filter);
	}, [fetchTasks, filter]);

	useEffect(() => {
		fetchTasks(true, filter);
	}, [fetchTasks, filter, fetchSerial]);

	const selectedTaskId = parseInt(searchParams.get("task") as string, 10);

	return (
		<>
			{status === LoadStatus.ERROR &&
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>}
			{(status === LoadStatus.DONE || status === LoadStatus.LOADING) &&
				<>
					<Table verticalSpacing={4} highlightOnHover mt="md">
						<thead>
							<tr><th>Task</th><th>Target</th><th>Exec/Change Time</th><th>Status</th><th></th></tr>
						</thead>
						<tbody>
							{tasks?.map((task) => (
								<tr key={task.id}>
									<td>{task.taskDescription}</td>
									<td>{task.target}</td>
									<td><TaskDateText task={task} /></td>
									<td>
										<TaskStatusIcon iconSize={16} status={task.status} />
										{task.repeating &&
											<ThemeIcon title="Repeating" color="gray" variant="light" radius="xl">
												<IconRepeat size={16} />
											</ThemeIcon>}
									</td>
									<td>
										<Group spacing={5} position="right">
											{task.status === "SCHEDULED" &&
												<ActionIcon variant="outline" title="Cancel">
													<IconPlayerStop size={14} />
												</ActionIcon>}
											<ActionIcon variant="outline" title="Monitor" onClick={() => setSearchParams({ task: String(task.id) })}>
												<IconHeartRateMonitor size={14} />
											</ActionIcon>
										</Group>
									</td>
								</tr>
							))}
							{status === LoadStatus.LOADING &&
								<tr><td colSpan={5}><Group position="center"><Loader size="sm" /></Group></td></tr>}
						</tbody>
					</Table>
					{hasMore &&
						<Group position="center">
							<Button onClick={handleMoreClick} compact>More...</Button>
						</Group>}
				</>}
			<TaskModal
				taskId={selectedTaskId}
				opened={!!selectedTaskId && !isNaN(selectedTaskId)}
				onClose={() => setSearchParams({})}
				onUpdate={() => { /* */ }}
			/>
		</>
	);
}