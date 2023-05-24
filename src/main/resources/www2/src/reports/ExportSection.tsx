import { ActionIcon, Button, Container, createStyles, Group, SimpleGrid, Switch, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconHelp } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { DomainSelector } from "../admin/DomainSelector";
import { Api, apiConfig } from "../apiUtils";
import { GroupSelector } from "../devices/GroupSelector";

const useStyles = createStyles((theme) => ({
}));

interface ReportParams {
	group?: Set<number>;
	domain?: Set<number>;
	interfaces?: boolean;
	inventory?: boolean;
	inventoryhistory?: boolean;
	locations?: boolean;
	compliance?: boolean;
	groups?: boolean;
	format?: string;
}

export default function ExportSection() {
	const { classes } = useStyles();
	const reportForm = useForm<ReportParams>({
		initialValues: {
			group: new Set<number>(),
			domain: new Set<number>(),
			format: "xlsx",
		},
	});
	const [downloadUrl, setDownloadUrl] = useState<string>("");

	const updateUrl = useCallback(async (data: ReportParams) => {
		const { url } = await Api.reportsPC.getDataXLSX(
			data.group, data.domain,
			data.interfaces,
			data.inventory, data.inventory && data.inventoryhistory,
			data.locations,
			data.compliance,
			data.groups,
			data.format);
		setDownloadUrl(apiConfig.basePath + url);
	}, []);

	useEffect(() => {
		updateUrl(reportForm.values);
	}, [reportForm.values, updateUrl]);

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Data export</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/User-Guide:-Reports#data-export"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<form>
				<Text m="sm">
					Data will be exported as Microsoft® Excel® file (.xlsx).
					You can customize the exported content using the options below,
					then click the Download button to generate and get the file.
				</Text>
				<SimpleGrid cols={2}>
					<DomainSelector
						selectedIds={reportForm.values.domain ? Array.from(reportForm.values.domain) : []}
						setSelectedIds={(ids) => {
							reportForm.setFieldValue("domain", new Set<number>(ids));
						}}
						label="Restrict export to the following domain(s)"
						clearable
					/>
					<GroupSelector
						selectedIds={reportForm.values.group ? Array.from(reportForm.values.group) : []}
						setSelectedIds={(ids) => {
							reportForm.setFieldValue("group", new Set<number>(ids));
						}}
						label="Restrict export to the following group(s)"
						clearable
					/>
				</SimpleGrid>
				<Switch
					label="Export the device group details"
					mt="sm"
					{...reportForm.getInputProps("groups")}
				/>
				<Switch
					label="Export the interfaces (including MAC and IP addresses)"
					mt="sm"
					{...reportForm.getInputProps("interfaces")}
				/>
				<Switch
					label="Export the inventory (modules, with part and serial numbers)"
					mt="sm"
					{...reportForm.getInputProps("inventory")}
				/>
				<Switch
					label="Export the history of modules (removed modules)"
					mt="sm"
					ml="sm"
					disabled={!reportForm.values.inventory}
					{...reportForm.getInputProps("inventoryhistory")}
				/>
				<Switch
					label="Export the locations and contacts"
					mt="sm"
					{...reportForm.getInputProps("locations")}
				/>
				<Switch
					label="Export compliance information"
					mt="sm"
					{...reportForm.getInputProps("compliance")}
				/>
				<Button<"a">
					component="a"
					href={downloadUrl}
					target="_blank"
					variant="outline"
					compact
					mt="md"
				>
					Download the report
				</Button>
			</form>
		</Container>
	);
}
