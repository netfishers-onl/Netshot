import React, { useCallback } from "react";
import { Button, Group, Modal, ModalProps, Paper, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Api } from "../apiUtils";
import { RsUserRestApiView } from "../api";
import { AxiosError } from "axios";
import { IconX } from "@tabler/icons-react";

interface DeleteUserModalProps extends ModalProps {
	user: RsUserRestApiView | undefined | null,
	onRefresh: () => void,
}

export function DeleteUserModal({ user, onRefresh, onClose, ...rest }: DeleteUserModalProps) {
	const userForm = useForm({
		initialValues: {},
	});

	const handleFormSubmit = useCallback(async () => {
		try {
			if (user && typeof user.id === "number") {
				await Api.admin.deleteUser(user.id);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to delete the user.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while deleting the user: ${error.response.data.errorMsg}`;
			}
			showNotification({
				id: "admin-user-delete",
				autoClose: 5000,
				title: "User deletion",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh, user]);

	return (
		<Modal
			title="Delete user"
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			<form onSubmit={userForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<Text>You are about to delete user <Text component="span" weight="bold">{user?.username}</Text>.</Text>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit" color="red">Delete</Button>
				</Group>
			</form>
		</Modal>
	);
}
