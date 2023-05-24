import { Container, Space } from "@mantine/core";
import ApiTokenList from "./ApiTokenList";
import UserList from "./UserList";

export default function UsersSection() {
	return (
		<Container>
			<UserList />
			<Space h={50} />
			<ApiTokenList />
		</Container>
	);
}
