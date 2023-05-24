import React, { useCallback } from "react";
import { Button, Group, Modal, ModalProps, Paper, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Api } from "../apiUtils";
import { RsApiTokenRestApiView } from "../api";
import { AxiosError } from "axios";
import { IconX } from "@tabler/icons-react";

interface DeleteApiTokenModalProps extends ModalProps {
	token: RsApiTokenRestApiView | undefined | null,
	onRefresh: () => void,
}

export function DeleteApiTokenModal({ token, onRefresh, onClose, ...rest }: DeleteApiTokenModalProps) {
	const tokenForm = useForm({
		initialValues: {},
	});

	const handleFormSubmit = useCallback(async () => {
		try {
			if (token && typeof token.id === "number") {
				await Api.admin.deleteApiToken(token.id);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to delete the API token.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while deleting the API token: ${error.response.data.errorMsg}`;
			}
			showNotification({
				id: "admin-apitoken-delete",
				autoClose: 5000,
				title: "API token deletion",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh, token]);

	return (
		<Modal
			title="Delete API token"
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			<form onSubmit={tokenForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<Text>
						You are about to delete API token <Text component="span" weight="bold">{token?.description}</Text>.
					</Text>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit" color="red">Delete</Button>
				</Group>
			</form>
		</Modal>
	);
}
