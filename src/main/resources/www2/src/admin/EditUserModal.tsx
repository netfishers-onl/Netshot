import { Button, Chip, Collapse, Group, Modal, ModalProps, Paper, PasswordInput, Switch, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { AxiosError } from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { RsUserRestApiView } from "../api";
import { Api } from "../apiUtils";
import { UserLevelDescs } from "../AuthProvider";

interface EditUserModalProps extends ModalProps {
	user: RsUserRestApiView | undefined | null,
	onRefresh: () => void,
}

export function EditUserModal({ user, onRefresh, opened, onClose, ...rest }: EditUserModalProps) {

	const userForm = useForm<RsUserRestApiView>({
		initialValues: {
			id: undefined,
			username: "",
			password: "",
			level: 100,
			local: true,
		},
		validate: {
			password: (value, values) => ((changePasswordDisplayed && !value && values.local) ?  "Password is required for local user" : null),
		},
	});
	const [changePasswordDisplayed, setChangePasswordDisplayed] = useState(false);

	const handleFormSubmit = useCallback(async (newUser: RsUserRestApiView) => {
		try {
			if (typeof newUser.id === "number") {
				const data = { ...newUser };
				if (!changePasswordDisplayed) {
					delete data.password;
				}
				await Api.admin.setUser(newUser.id, data);
			}
			else {
				// Create
				await Api.admin.addUser(newUser);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to save the user.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while saving the user: ${error.response.data.errorMsg}`
			}
			showNotification({
				id: "admin-user-edit",
				autoClose: 5000,
				title: (typeof newUser.id === "number") ? "User edition" : "User creation",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [changePasswordDisplayed, onClose, onRefresh]);

	useEffect(() => {
		if (user) {
			userForm.setValues(user);
		}
		else if (!opened) {
			// Reset data when closing the modal
			userForm.reset();
			setChangePasswordDisplayed(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, opened]);

	return (
		<Modal
			title={user ? "Edit user" : "Add user"}
			opened={opened}
			onClose={onClose}
			closeOnClickOutside={false}
			size={400}
			{...rest}
		>
			<form onSubmit={userForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<TextInput
						label="Name"
						placeholder="Username"
						required
						autoComplete="new-username"
						{...userForm.getInputProps("username")}
					/>
					<Chip.Group
						value={String(userForm.values.level)}
						onChange={(v) => {
							if (typeof v === "string") {
								userForm.setFieldValue("level", parseInt(v));
							}
						}}
					>
						<Group mt="md" spacing="xs">
							{UserLevelDescs.map((level) => (
								<Chip key={level[2]} value={String(level[2])}>
									{level[0]}
								</Chip>
							))}
						</Group>
					</Chip.Group>
					<Switch
						label="Remote user"
						mt="md"
						checked={!userForm.values.local}
						onChange={(event) => {
							userForm.setFieldValue("local", !event.currentTarget.checked);
							if (!event.currentTarget.checked) {
								setChangePasswordDisplayed(false);
							}
						}}
					/>
					<Collapse in={!!user && !!userForm.values.local}>
						<Switch
							label="Change password"
							mt="md"
							checked={changePasswordDisplayed}
							onChange={(event) => setChangePasswordDisplayed(event.currentTarget.checked)}
						/>
					</Collapse>
					<Collapse in={!!userForm.values.local && (!user || changePasswordDisplayed)}>
						<PasswordInput
							label="Password"
							placeholder="User's password"
							autoComplete="new-password"
							mt="md"
							{...userForm.getInputProps("password")}
						/>
					</Collapse>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit">Save</Button>
				</Group>
			</form>
		</Modal>
	);
}
