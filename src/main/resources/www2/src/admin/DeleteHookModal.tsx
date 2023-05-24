import React, { useCallback } from "react";
import { Button, Group, Modal, ModalProps, Paper, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Api } from "../apiUtils";
import { HookRestApiView } from "../api";
import { AxiosError } from "axios";
import { IconX } from "@tabler/icons-react";

interface DeleteHookModalProps extends ModalProps {
	hook: HookRestApiView | undefined | null,
	onRefresh: () => void,
}

export function DeleteHookModal({ hook, onRefresh, onClose, ...rest }: DeleteHookModalProps) {
	const hookForm = useForm({
		initialValues: {},
	});

	const handleFormSubmit = useCallback(async () => {
		try {
			if (hook && typeof hook.id === "number") {
				await Api.admin.deleteHook(hook.id);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to delete the hook.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while deleting the hook: ${error.response.data.errorMsg}`;
			}
			showNotification({
				id: "admin-hook-delete",
				autoClose: 5000,
				title: "Hook deletion",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh, hook]);

	return (
		<Modal
			title="Delete hook"
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			<form onSubmit={hookForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<Text>You are about to delete hook <Text component="span" weight="bold">{hook?.name}</Text>.</Text>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit" color="red">Delete</Button>
				</Group>
			</form>
		</Modal>
	);
}
