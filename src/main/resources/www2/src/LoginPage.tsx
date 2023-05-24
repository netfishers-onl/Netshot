import { Alert, Box, Button, Center, Container, Loader, LoadingOverlay, Paper, PasswordInput, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { cleanNotifications } from "@mantine/notifications";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { NetshotLogo } from "./NetshotLogo";


function LoginPage() {
	const auth = useAuth();
	const [loggingIn, setLoggingIn] = useState<boolean>(false);

	useEffect(() => {
		cleanNotifications();
	}, []);

	const form = useForm<{ username: string, password: string }>({
		initialValues: {
			username: "",
			password: "",
		},
	});

	const handleFormSubmit = useCallback(async ({ username, password }: { username: string, password: string }) => {
		setLoggingIn(true);
		form.clearErrors();
		const user = await auth.login(username, password);
		if (!user) {
			form.setErrors({ password: "Invalid username or password" });
		}
		setLoggingIn(false);
	}, [auth, form]);

	let content: JSX.Element;

	if (auth.status === "init") {
		content = (
			<Center mt="md"><Loader /></Center>
		);
	}
	else if (auth.status === "server-error") {
		content = (
			<Alert icon={<IconAlertCircle size={16} />} title="Server error" color="red" mt="md">
				Unable to connect to Netshot server. Please check connectivity and try to refresh the page.
			</Alert>
		);
	}
	else {
		content = (
			<Paper withBorder shadow="md" p={30} mt="md" radius="md">
				<Box pos="relative">
					<LoadingOverlay visible={loggingIn} overlayBlur={1} />
					<form onSubmit={form.onSubmit(handleFormSubmit)}>
						<Text mb="md">
							Please authenticate to access Netshot.
						</Text>
						<TextInput
							label="Username"
							placeholder="Your username"
							required
							autoComplete="username"
							{...form.getInputProps("username")}
						/>
						<PasswordInput
							label="Password"
							placeholder="Your password"
							required
							autoComplete="password"
							mt="md"
							{...form.getInputProps("password")}
						/>
						<Button
							fullWidth
							mt="xl"
							type="submit"
						>
							Log in
						</Button>
					</form>
				</Box>
			</Paper>
		);
	}

	return (
		<Container size={420} my={40}>
			<Title align="center">
				<NetshotLogo width={400} />
			</Title>
			<Text color="dimmed" size="md" align="center" mt={5}>
				<Text weight="bold" span>Configuration</Text> and <Text weight="bold" span>Compliance</Text> Management<br />
				for <Text weight="bold" span>Network</Text> and <Text weight="bold" span>Security</Text> Equipments
			</Text>

			{content}
		</Container>
	);
}

export default LoginPage;
