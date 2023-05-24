import { ActionIcon, Alert, Button, Container, createStyles, Group, Loader, Menu, SimpleGrid, Switch, Text, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconBolt, IconHelp } from "@tabler/icons-react";
import { Chart as ChartJS, BarElement, CategoryScale, ChartOptions, Legend, LinearScale, Title as ChartTitle, Tooltip, ChartData, TimeScale, TimeSeriesScale } from "chart.js";
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { DomainSelector } from "../admin/DomainSelector";
import { RsConfigChangeNumberByDateStatRestApiView, RsLightConfigRestApiView } from "../api";
import { Api, apiConfig, LoadStatus } from "../apiUtils";
import { GroupSelector } from "../devices/GroupSelector";

const useStyles = createStyles((theme) => ({
	chartContainer: {
		maxWidth: 600,
	}
}));

ChartJS.register(
	CategoryScale,
	LinearScale,
	TimeScale,
	TimeSeriesScale,
	BarElement,
	ChartTitle,
	Tooltip,
	Legend,
);

interface ReportParams {
	group?: Set<number>;
	domain?: Set<number>;
	before: Date | null,
	after: Date | null,
}

export default function ConfigChangesChart() {
	const { classes, theme } = useStyles();
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [configChanges, setConfigChanges] = useState<Array<RsLightConfigRestApiView>>([]);
	const reportForm = useForm<ReportParams>({
		initialValues: {
			group: new Set<number>(),
			domain: new Set<number>(),
			before: dayjs().subtract(7, "days").startOf("day").toDate(),
			after: dayjs().endOf("day").toDate(),
		},
	});

	const fetchConfigChanges = useCallback(async () => {
		try {
			setConfigChanges((await Api.reports.getConfigs(reportForm.values.after?.getTime(),
				reportForm.values.before?.getTime(), reportForm.values.domain,
				reportForm.values.group)).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
	}, []);

	useEffect(() => {
		fetchConfigChanges();
	}, [fetchConfigChanges, lastFetch]);

	let chart = null;
	if (status === LoadStatus.DONE) {
		const changeMax = Math.max(1, ...last7DaysChangesByDayStats.map((dayStat) => dayStat.changeCount || 0));

		const chartOptions: ChartOptions<"bar"> = {
			responsive: true,
			scales: {
				x: {
					type: "timeseries",
					time: {
						unit: "day",
						displayFormats: {
							day: "MM-DD"
						}
					},
				},
				y: {
					min: 0,
					suggestedMax: changeMax * 1.2,
					ticks: {
						maxTicksLimit: Math.min(5, changeMax + 2),
					}
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				title: {
					display: true,
					text: "Number of changes over the last days",
				},
				tooltip: {
					boxPadding: 3,
				},
			},
		};
	
		const chartData: ChartData<"bar"> = {
			labels: last7DaysChangesByDayStats.map((dayStat) => dayStat.changeDay),
			datasets: [{
				label: "Changes",
				borderRadius: 8,
				data: last7DaysChangesByDayStats.map((dayStat) => dayStat.changeCount || 0),
				backgroundColor: theme.colors[theme.primaryColor][6],
			}],
		};

		chart = (
			<Bar options={chartOptions} data={chartData} />
		);
	}

	const quickDateRanges: Record<string, () => void> = {
		"Today": () => {
			const n = dayjs();
			reportForm.setFieldValue("after", n.startOf("day").toDate());
			reportForm.setFieldValue("before", n.endOf("day").toDate());
		},
		"Yesterday": () => {
			const n = dayjs().subtract(1, "day");
			reportForm.setFieldValue("after", n.startOf("day").toDate());
			reportForm.setFieldValue("before", n.endOf("day").toDate());
		},
		"Last 7 days": () => {
			const n = dayjs();
			reportForm.setFieldValue("after", n.subtract(7, "day").startOf("day").toDate());
			reportForm.setFieldValue("before", n.endOf("day").toDate());
		},
		"This week": () => {
			const n = dayjs();
			reportForm.setFieldValue("after", n.startOf("week").toDate());
			reportForm.setFieldValue("before", n.endOf("week").toDate());
		},
		"Last week": () => {
			const n = dayjs().subtract(1, "week");
			reportForm.setFieldValue("after", n.startOf("week").toDate());
			reportForm.setFieldValue("before", n.endOf("week").toDate());
		},
	};

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Configuration changes</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Reports#configuration-changes"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<form>
				<Text m="sm">
					Here you can visualize the configuration changes over a specific period.
				</Text>
				<SimpleGrid cols={3}>
					<DatePickerInput
						label="Change period"
						type="range"
						value={[reportForm.values.after, reportForm.values.before]}
						valueFormat="YYYY-MM-DD"
						onChange={([after, before]) => {
							reportForm.setFieldValue("after", after);
							reportForm.setFieldValue("before", before);
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
					<DomainSelector
						selectedIds={reportForm.values.domain ? Array.from(reportForm.values.domain) : []}
						setSelectedIds={(ids) => {
							reportForm.setFieldValue("domain", new Set<number>(ids));
						}}
						label="Filter on domain(s)"
						clearable
					/>
					<GroupSelector
						selectedIds={reportForm.values.group ? Array.from(reportForm.values.group) : []}
						setSelectedIds={(ids) => {
							reportForm.setFieldValue("group", new Set<number>(ids));
						}}
						label="Filter on group(s)"
						clearable
					/>
				</SimpleGrid>
				<Button
					variant="outline"
					compact
					mt="md"
					disabled={!(reportForm.values.before && reportForm.values.after)}
				>
					Update
				</Button>
			</form>
			{status === LoadStatus.ERROR && (
				<Alert icon={(<IconAlertCircle size={16} />)} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>
			)}
			{status === LoadStatus.LOADING &&
				<Group position="center"><Loader size="sm" /></Group>}
			{status === LoadStatus.DONE &&
				<div className={classes.chartContainer}>
					{chart}
				</div>}
		</Container>
	);
}
