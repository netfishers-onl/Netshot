import React, { useCallback } from "react";
import { Button, Group, Modal, ModalProps, Paper, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Api } from "../apiUtils";
import { DeviceCredentialSetRestApiView } from "../api";
import { AxiosError } from "axios";
import { IconX } from "@tabler/icons-react";

interface DeleteCredentialSetModalProps extends ModalProps {
	credentialSet: DeviceCredentialSetRestApiView | undefined | null,
	onRefresh: () => void,
}

export function DeleteCredentialSetModal({ credentialSet, onRefresh, onClose, ...rest }: DeleteCredentialSetModalProps) {
	const credentialSetForm = useForm({
		initialValues: {},
	});

	const handleFormSubmit = useCallback(async () => {
		try {
			if (credentialSet && typeof credentialSet.id === "number") {
				await Api.admin.deleteCredentialSet(credentialSet.id);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to delete the credentials.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while deleting the credentials: ${error.response.data.errorMsg}`;
			}
			showNotification({
				id: "admin-credentialset-delete",
				autoClose: 5000,
				title: "Credentials deletion",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh, credentialSet]);

	return (
		<Modal
			title="Delete credentials"
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			<form onSubmit={credentialSetForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<Text>You are about to delete credential set <Text component="span" weight="bold">{credentialSet?.name}</Text>.</Text>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit" color="red">Delete</Button>
				</Group>
			</form>
		</Modal>
	);
}
