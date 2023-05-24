import { Badge, Button, createStyles, Group, Modal, ModalProps, Paper, Grid, Text } from "@mantine/core";
import { DeviceDriverRestApiView } from "../api";

const useStyles = createStyles((theme) => ({
	name: {
		color: theme.colors.gray[6],
		fontSize: theme.fontSizes.xs,
	},
	value: {
		color: theme.black,
	},
	codeValue: {
		color: theme.black,
		fontFamily: theme.fontFamilyMonospace,
	},
}));

interface DriverModalProps extends ModalProps {
	driver: DeviceDriverRestApiView | undefined,
}

export function DriverModal({ driver, onClose, ...rest }: DriverModalProps) {
	const { classes } = useStyles();

	return (
		<Modal
			title="Driver details"
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			{driver &&
				<Paper>
					<Grid>
						<Grid.Col span={4}>
							<Text className={classes.name}>Unique name</Text>
							<Text className={classes.codeValue}>{driver.name}</Text>
						</Grid.Col>
						<Grid.Col span={8}>
							<Text className={classes.name}>Description</Text>
							<Text weight="bold" className={classes.value}>{driver.description}</Text>
						</Grid.Col>
						<Grid.Col span={4}>
							<Text className={classes.name}>Author</Text>
							<Text className={classes.value}>{driver.author}</Text>
						</Grid.Col>
						<Grid.Col span={2}>
							<Text className={classes.name}>Version</Text>
							<Text className={classes.value}>{driver.version}</Text>
						</Grid.Col>
						<Grid.Col span={2}>
							<Text className={classes.name}>Priority</Text>
							<Text className={classes.value}>{driver.priority}</Text>
						</Grid.Col>
						<Grid.Col span={4}>
							<Text className={classes.name}>Protocols</Text>
							<div>
								{driver.protocols && Array.from(driver.protocols).map((proto) =>
									<Badge key={proto}>{proto}</Badge>)}
							</div>
						</Grid.Col>
						<Grid.Col span={7}>
							<Text className={classes.name}>Source code hash</Text>
							<Text className={classes.codeValue}>{driver.sourceHash}</Text>
						</Grid.Col>
						<Grid.Col span={12}>
							<Text className={classes.name}>Source location</Text>
							<Text className={classes.codeValue}>
								{driver.location?.type === "EMBEDDED" ?
									<Badge>Netshot Embedded</Badge> : driver.location?.fileName}
							</Text>
						</Grid.Col>
					</Grid>
				</Paper>}
			<Group position="right" mt="lg">
				<Button variant="subtle" onClick={onClose}>Close</Button>
			</Group>
		</Modal>
	);
}
