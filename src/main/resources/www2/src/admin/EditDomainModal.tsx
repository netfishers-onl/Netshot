import { Button, Group, Modal, ModalProps, Paper, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { AxiosError } from "axios";
import { useCallback, useEffect } from "react";
import { RsDomainRestApiView } from "../api";
import { Api, IPV4_REGEXP } from "../apiUtils";

interface EditDomainModalProps extends ModalProps {
	domain: RsDomainRestApiView | undefined | null,
	onRefresh: () => void,
}

export function EditDomainModal({ domain, onRefresh, opened, onClose, ...rest }: EditDomainModalProps) {

	const domainForm = useForm<RsDomainRestApiView>({
		initialValues: {
			id: undefined,
			name: "",
			description: "",
			ipAddress: "10.1.1.1",
		},
		validate: {
			ipAddress: (value) => (value && value.match(IPV4_REGEXP) ? null : "Invalid IPv4 address"),
		},
	});

	const handleFormSubmit = useCallback(async (newDomain: RsDomainRestApiView) => {
		try {
			if (typeof newDomain.id === "number") {
				// Update
				await Api.admin.setDomain(newDomain.id, newDomain);
			}
			else {
				// Create
				await Api.admin.addDomain(newDomain);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to save the domain.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while saving the domain: ${error.response.data.errorMsg}`
			}
			showNotification({
				id: "admin-domain-edit",
				autoClose: 5000,
				title: (typeof newDomain.id === "number") ? "Domain edition" : "Domain creation",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh]);

	useEffect(() => {
		if (domain) {
			domainForm.setValues(domain);
		}
		else if (!opened) {
			// Reset data when closing the modal
			domainForm.reset();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [domain, opened]);

	return (
		<Modal
			title={domain ? "Edit domain" : "Add domain"}
			opened={opened}
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			<form onSubmit={domainForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<TextInput
						label="Name"
						placeholder="Name"
						required
						autoComplete="new-name"
						{...domainForm.getInputProps("name")}
					/>
					<TextInput
						label="Description"
						placeholder="Description"
						required
						autoComplete="new-description"
						mt="md"
						{...domainForm.getInputProps("description")}
					/>
					<TextInput
						label="Netshot server IP address"
						placeholder="Server address"
						required
						autoComplete="new-ipaddress"
						mt="md"
						{...domainForm.getInputProps("ipAddress")}
					/>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit">Save</Button>
				</Group>
			</form>
		</Modal>
	);
}
