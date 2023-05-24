import { Container, Space } from "@mantine/core";
import ConfigChangesChart from "./ConfigChangesChart";

export default function ConfigChangesSection() {
	return (
		<Container>
			<ConfigChangesChart />
			<Space h={50} />
		</Container>
	);
}
