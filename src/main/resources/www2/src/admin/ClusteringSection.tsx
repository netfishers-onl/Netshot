import React, { useCallback, useEffect, useState } from "react";
import { ActionIcon, Alert, Badge, Button, Card, Container, createStyles, Group, Loader, SimpleGrid, Text, Title } from "@mantine/core";
import dayjs from "dayjs";
import { ClusterMemberRestApiView } from "../api";
import { Api, LoadStatus } from "../apiUtils";
import { IconAlertCircle, IconHelp, IconInfoCircle } from "@tabler/icons-react";
import { useToggle } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
	card: {
		backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
	},
	hostname: {
		fontSize: theme.fontSizes.xl,
		fontWeight: "bold",
	},
}));

interface ClusterMemberProps {
	member: ClusterMemberRestApiView;
}

function ClusterMember({ member }: ClusterMemberProps) {
	const { classes } = useStyles();

	return (
		<Card withBorder radius="md" p="md" m="md" className={classes.card}>
			<Group position="apart">
				<div>
					<Text className={classes.hostname}>{member.hostname}</Text>
					<Text color="dimmed" size="xs">{member.instanceId}</Text>
				</div>
				<Group>
					{member.local && <Badge color="dark">Local</Badge>}
					<Badge
						variant={member.status === "MASTER" ? "filled" : "outline"}
						color={member.status === "EXPIRED" ? "red" : "blue"}
					>
						{member.status}
					</Badge>
				</Group>
			</Group>
			<SimpleGrid cols={4} mt="md">
				<div>
					<Text weight={500} size="lg" align="center">
						{member.appVersion}
					</Text>
					<Text size="xs" color="dimmed" align="center">Netshot Version</Text>
				</div>
				<div>
					<Text weight={500} size="lg" align="center">
						{member.masterPriority}
					</Text>
					<Text size="xs" color="dimmed" align="center">Master priority</Text>
				</div>
				<div>
					<Text weight={500} size="lg" align="center">
						{member.runnerPriority}
					</Text>
					<Text size="xs" color="dimmed" align="center">Runner priority</Text>
				</div>
				<div>
					<Text weight={500} size="lg" align="center">
						{member.runnerWeight}
					</Text>
					<Text size="xs" color="dimmed" align="center">Runner weight</Text>
				</div>
			</SimpleGrid>
			<SimpleGrid cols={3} mt="md">
				<div>
					<Text weight={500} size="md" align="center" color={member.status === "EXPIRED" ? "red" : undefined}>
						{member.lastSeenTime ? dayjs(member.lastSeenTime).fromNow() : "-"}
					</Text>
					<Text size="xs" color="dimmed" align="center">Last seen</Text>
				</div>
				<div>
					<Text weight={500} size="md" align="center">
						{member.lastStatusChangeTime ? dayjs(member.lastStatusChangeTime).fromNow() : "-"}
					</Text>
					<Text size="xs" color="dimmed" align="center">Last status change</Text>
				</div>
				<div>
					<Text weight={500} size="md" align="center">
						{member.driverHash?.substring(0, 12)}
					</Text>
					<Text size="xs" color="dimmed" align="center">Driver checksum</Text>
				</div>
			</SimpleGrid>
		</Card>
	);
}

export default function ClusteringSection() {
	const [status, setStatus] = useState<LoadStatus>(LoadStatus.LOADING);
	const [lastFetch, setLastFetch] = useState<number>(0);
	const [clusterMembers, setClusterMembers] = useState<Array<ClusterMemberRestApiView>>([]);
	const [reloading, toggleReloading] = useToggle();

	const fetchClusterMembers = useCallback(async () => {
		try {
			setClusterMembers((await Api.admin.getClusterMembers()).data);
			setStatus(LoadStatus.DONE);
		}
		catch (error: unknown) {
			setStatus(LoadStatus.ERROR);
		}
		toggleReloading(false);
	}, []);

	useEffect(() => {
		fetchClusterMembers();
	}, [fetchClusterMembers, lastFetch]);

	const handleRefresh = useCallback(async () => {
		toggleReloading(true);
		setLastFetch(Date.now());
	}, [setLastFetch]);

	return (
		<Container>
			<Group position="apart" mt="xl">
				<Title order={3}>Cluster members</Title>
				<ActionIcon<"a">
					variant="transparent"
					component="a"
					href="https://github.com/netfishers-onl/Netshot/wiki/Clustering-and-High-Availability"
					target="_blank"
					title="Link to user guide"
				>
					<IconHelp color="gray" />
				</ActionIcon>
			</Group>
			<Group position="left" mt="md">
				<Button variant="outline" compact onClick={handleRefresh} loading={reloading}>
					Refresh status
				</Button>
			</Group>
			{status === LoadStatus.ERROR && (
				<Alert icon={<IconAlertCircle size={16} />} title="Data error" color="red" mt="md">
					Unable to load data from the server.
				</Alert>
			)}
			{status === LoadStatus.LOADING && (
				<Group position="center"><Loader size="sm" /></Group>
			)}
			{status === LoadStatus.DONE && clusterMembers.length === 0 && (
				<Alert icon={<IconInfoCircle size={16} />} title="No cluster" mt="md">
					Clustering is not enabled on this instance.
				</Alert>
			)}
			{(status === LoadStatus.DONE) &&
				clusterMembers.map((member) => (
					<ClusterMember
						member={member}
						key={member.instanceId}
					/>
				))}
		</Container>
	);
}
