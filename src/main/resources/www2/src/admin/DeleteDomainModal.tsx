import React, { useCallback } from "react";
import { Button, Group, Modal, ModalProps, Paper, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Api } from "../apiUtils";
import { RsDomainRestApiView } from "../api";
import { AxiosError } from "axios";
import { IconX } from "@tabler/icons-react";

interface DeleteDomainModalProps extends ModalProps {
	domain: RsDomainRestApiView | undefined | null,
	onRefresh: () => void,
}

export function DeleteDomainModal({ domain, onRefresh, onClose, ...rest }: DeleteDomainModalProps) {
	const domainForm = useForm({
		initialValues: {},
	});

	const handleFormSubmit = useCallback(async () => {
		try {
			if (domain && typeof domain.id === "number") {
				await Api.admin.deleteDomain(domain.id);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to delete the domain. Please ensure it's not referenced by devices or other items.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while deleting the domain: ${error.response.data.errorMsg}`;
			}
			showNotification({
				id: "admin-domain-delete",
				autoClose: 5000,
				title: "Domain deletion",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh, domain]);

	return (
		<Modal
			title="Delete domain"
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			<form onSubmit={domainForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<Text>You are about to delete domain <Text component="span" weight="bold">{domain?.name}</Text>.</Text>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit" color="red">Delete</Button>
				</Group>
			</form>
		</Modal>
	);
}
