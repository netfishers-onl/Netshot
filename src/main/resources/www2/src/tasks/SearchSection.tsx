import React, { useCallback, useState } from "react";
import { ActionIcon, Button, Container, Group, Menu, MultiSelect, SimpleGrid, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { TaskRestApiViewStatusEnum } from "../api";
import { SearchFilter, TaskList } from "./TaskList";
import { IconBolt, IconHelp } from "@tabler/icons-react";
import dayjs from "dayjs";

export interface TaskStatusMultiSelectProps {
	allowedValues: Set<TaskRestApiViewStatusEnum>,
	values: Set<TaskRestApiViewStatusEnum>,
	onChange: (values: Set<TaskRestApiViewStatusEnum>) => void,
	error?: React.ReactNode;
}

function TaskStatusMultiSelect({
	allowedValues,
	values,
	onChange,
	error,
}: TaskStatusMultiSelectProps): JSX.Element {
	return (
		<MultiSelect
			label="Task status"
			placeholder="Filter on given status(es)"
			data={Object.entries(TaskRestApiViewStatusEnum)
				.filter(([label, value]) => allowedValues.has(value)).map(([label, value]) => ({ value, label }))}
			value={Array.from(values).map(s => String(s))}
			onChange={(newValues) => onChange(
				new Set<TaskRestApiViewStatusEnum>(newValues.map(v => v as TaskRestApiViewStatusEnum)))}
				error={error}
		/>
	);
}

export default function SearchSection() {
	const [taskFilter, setTaskFilter] = useState<SearchFilter>();
	const searchForm = useForm<SearchFilter>({
		initialValues: {
			statuses: new Set<TaskRestApiViewStatusEnum>([
				TaskRestApiViewStatusEnum.Success,
				TaskRestApiViewStatusEnum.Failure,
				TaskRestApiViewStatusEnum.Cancelled,
			]),
			after: dayjs().startOf("day").toDate(),
			before: dayjs().endOf("day").toDate(),
		},
		validate: {
			statuses: (value) => (value.size === 0) ? "Select at least one status" : null,
		},
	});

	const handleFormSubmit = useCallback(async () => {
		setTaskFilter({ ...searchForm.values });
	}, [setTaskFilter, searchForm.values]);

	const quickDateRanges: Record<string, () => void> = {
		"Today": () => {
			const n = dayjs();
			searchForm.setFieldValue("after", n.startOf("day").toDate());
			searchForm.setFieldValue("before", n.endOf("day").toDate());
		},
		"Yesterday": () => {
			const n = dayjs().subtract(1, "day");
			searchForm.setFieldValue("after", n.startOf("day").toDate());
			searchForm.setFieldValue("before", n.endOf("day").toDate());
		},
		"Last 7 days": () => {
			const n = dayjs();
			searchForm.setFieldValue("after", n.subtract(7, "day").startOf("day").toDate());
			searchForm.setFieldValue("before", n.endOf("day").toDate());
		},
		"This week": () => {
			const n = dayjs();
			searchForm.setFieldValue("after", n.startOf("week").toDate());
			searchForm.setFieldValue("before", n.endOf("week").toDate());
		},
		"Last week": () => {
			const n = dayjs().subtract(1, "week");
			searchForm.setFieldValue("after", n.startOf("week").toDate());
			searchForm.setFieldValue("before", n.endOf("week").toDate());
		},
	};

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Search tasks</Title>
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
			<form onSubmit={searchForm.onSubmit(handleFormSubmit)}>
				<SimpleGrid m="md" cols={2}>
					<TaskStatusMultiSelect
						allowedValues={new Set([
							TaskRestApiViewStatusEnum.Cancelled,
							TaskRestApiViewStatusEnum.Failure,
							TaskRestApiViewStatusEnum.Success,
						])}
						values={searchForm.values.statuses}
						onChange={(values) => searchForm.setFieldValue("statuses", values)}
						error={searchForm.errors.statuses}
					/>
					<DatePickerInput
						label="Date range"
						type="range"
						placeholder="Filter on given dates"
						value={[searchForm.values.after, searchForm.values.before]}
						onChange={([fromDate, toDate]) => {
							searchForm.setFieldValue("after", fromDate);
							searchForm.setFieldValue("before", toDate);
						}}
						allowSingleDateInRange
						rightSection={
							<Menu>
								<Menu.Target>
									<ActionIcon>
										<IconBolt />
									</ActionIcon>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Label>Quick selectors</Menu.Label>
									{Object.entries(quickDateRanges).map(([label, func]) =>
										<Menu.Item key={label} onClick={func}>
											{label}
										</Menu.Item>)}
								</Menu.Dropdown>
							</Menu>
						}
					/>
				</SimpleGrid>
				<Group position="left" mt="md">
					<Button variant="outline" compact type="submit">Search</Button>
				</Group>
			</form>
			{taskFilter &&
				<TaskList filter={taskFilter} />}
		</Container>
	);
}
