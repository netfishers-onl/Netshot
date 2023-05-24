import { Avatar, Badge, Button, Collapse, Container, Group, LoadingOverlay, Modal, ModalProps, Paper, PasswordInput, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useToggle } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { useCallback } from "react";
import { useAuth, UserLevelDescs } from "./AuthProvider";
import { RsLoginRestApiView } from "./api";
import { Api } from "./apiUtils";
import { AxiosError } from "axios";
import { IconCheck, IconX } from "@tabler/icons-react";

export function CurrentUserModal({ onClose, ...rest }: ModalProps) {
	const auth = useAuth();
	const [passwordChangerDisplayed, togglePasswordChangerDisplayed] = useToggle();
	const [passwordChanging, togglePasswordChanging] = useToggle();
	const [processing, toggleProcessing] = useToggle();

	const changePasswordForm = useForm({
		initialValues: {
			oldPassword: "",
			newPassword1: "",
			newPassword2: "",
		},
		validate: (values) => ({
			newPassword2: (values.newPassword1 !== values.newPassword2) ? "Passwords don't match" : null,
		}),
	});

	const handleLogout = useCallback(async () => {
		toggleProcessing(true);
		await auth.logout();
	}, [auth]);

	const handleChangePasswordSubmit = useCallback(
		async ({ oldPassword, newPassword1, newPassword2 }: { oldPassword: string, newPassword1: string, newPassword2: string }) => {
			if (auth.currentUser && auth.currentUser.id !== undefined) {
				const upUser : RsLoginRestApiView = {
					username: auth.currentUser.username,
					password: oldPassword,
					newPassword: newPassword1,
				};
				try {
					togglePasswordChanging(true);
					await Api.login.setPassword(auth.currentUser.id, upUser);
					showNotification({
						id: "password-change",
						autoClose: 5000,
						title: "Password update",
						message: "Your password was successfully updated.",
						color: "green",
						icon: <IconCheck size={18} />,
					});
					togglePasswordChangerDisplayed(false);
				}
				catch (error: unknown) {
					let message = "Cannot update your password.";
					if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
						message = `Error while updating your password: ${error.response.data.errorMsg}`
					}
					showNotification({
						id: "password-change",
						autoClose: 5000,
						title: "Password update",
						message,
						color: "red",
						icon: <IconX size={18} />,
					});
				}
				togglePasswordChanging(false);
			}
		}, [auth.currentUser, togglePasswordChanging, togglePasswordChangerDisplayed]);

	const level = UserLevelDescs.find(l => l[2] === auth.currentUser?.level);

	return (
		<Modal
			title="Account details"
			onClose={onClose}
			closeOnClickOutside={false}
			{...rest}
		>
			<LoadingOverlay visible={processing} overlayBlur={1} />
			{auth.currentUser &&
				<Paper>
					<Group>
						<Avatar radius="xl" size="xl" />
						<div>
							{auth.currentUser.local ?
								<Badge>Local user</Badge> :
								<Badge color="cyan">Remote user</Badge>}
							{level && <Badge color="green" variant="filled">{level[0]}</Badge>}
							<Text mt="xs">You are connected as <Text weight="bold" component="span">{auth.currentUser.username}</Text>.</Text>
						</div>
					</Group>
					<Group position="center" m="md">
						{auth.currentUser.local &&
							<Button variant="outline" onClick={() => togglePasswordChangerDisplayed(true)} disabled={passwordChangerDisplayed}>
								Change password
							</Button>}
						<Button color="gray" variant="outline" onClick={handleLogout}>
							Log out
						</Button>
					</Group>
					<Collapse in={passwordChangerDisplayed}>
						<form onSubmit={changePasswordForm.onSubmit(handleChangePasswordSubmit)}>
							<Container>
								<PasswordInput
									label="Old password"
									placeholder="Your old password"
									required
									my="xs"
									{...changePasswordForm.getInputProps("oldPassword")}
								/>
								<PasswordInput
									label="New password"
									placeholder="Your new password"
									required
									my="xs"
									{...changePasswordForm.getInputProps("newPassword1")}
								/>
								<PasswordInput
									label="Repeat password"
									placeholder="Your new password"
									required
									my="xs"
									{...changePasswordForm.getInputProps("newPassword2")}
								/>
								<Group position="right" mt="md">
									<Button variant="subtle" onClick={() => togglePasswordChangerDisplayed(false)}>Cancel</Button>
									<Button type="submit" loading={passwordChanging}>Change</Button>
								</Group>
							</Container>
						</form>
					</Collapse>
				</Paper>
			}
		</Modal>
	)
}