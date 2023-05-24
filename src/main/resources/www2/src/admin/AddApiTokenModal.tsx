import { ActionIcon, Alert, Button, Chip, createStyles, Group, Modal, ModalProps, Paper, Space, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconInfoCircle, IconRefresh, IconX } from "@tabler/icons-react";
import { AxiosError } from "axios";
import React, { useCallback, useEffect } from "react";
import { RsApiTokenRestApiView } from "../api";
import { Api } from "../apiUtils";
import { UserLevelDescs } from "../AuthProvider";

const useStyles = createStyles((theme) => ({
	tokenInput: {
		fontFamily: theme.fontFamilyMonospace,
	},
}));

interface EditUserModalProps extends ModalProps {
	onRefresh: () => void,
}

const generateToken = () => {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array(32)
		.fill(0)
		.map(() => chars[Math.floor(Math.random() * chars.length)])
		.join("");
};

export function AddApiTokenModal({ onRefresh, opened, onClose, ...rest }: EditUserModalProps) {
	const { classes } = useStyles();

	const tokenForm = useForm<RsApiTokenRestApiView>({
		initialValues: {
			id: undefined,
			level: 100,
			token: "",
			description: "",
		},
		validate: {
		},
	});

	const handleFormSubmit = useCallback(async (newToken: RsApiTokenRestApiView) => {
		try {
			await Api.admin.addApiToken(newToken);
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to add API token.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while saving the API token: ${error.response.data.errorMsg}`;
			}
			showNotification({
				id: "admin-apitoken-add",
				autoClose: 5000,
				title: "API token creation",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh]);

	const handleRefreshClick = useCallback(() => {
		tokenForm.setFieldValue("token", generateToken());
	}, [tokenForm]);

	useEffect(() => {
		if (!opened) {
			// Reset data when closing the modal
			tokenForm.reset();
		}
		else {
			tokenForm.setFieldValue("token", generateToken());
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened]);

	return (
		<Modal
			title="Add API token"
			opened={opened}
			onClose={onClose}
			closeOnClickOutside={false}
			size={600}
			{...rest}
		>
			<form onSubmit={tokenForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<TextInput
						label="Description"
						placeholder="Description"
						required
						autoComplete="new-description"
						{...tokenForm.getInputProps("description")}
					/>
					<Chip.Group
						value={String(tokenForm.values.level)}
						onChange={(v) => {
							if (typeof v === "string") {
								tokenForm.setFieldValue("level", parseInt(v, 10));
							}
						}}
					>
						<Group mt="md" spacing="xs" position="center" mx={50}>
							{UserLevelDescs.map((level) => (
								<Chip key={level[2]} value={String(level[2])}>
									{level[0]}
								</Chip>
							))}
						</Group>
					</Chip.Group>
					<TextInput
						label="New token"
						placeholder="Token"
						disabled
						required
						autoComplete="new-token"
						classNames={{ input: classes.tokenInput }}
						mt="md"
						mb="md"
						rightSection={(
							<ActionIcon onClick={handleRefreshClick}>
								<IconRefresh />
							</ActionIcon>
						)}
						{...tokenForm.getInputProps("token")}
					/>
					<Alert icon={<IconInfoCircle size={16} />}>
						Note: Please copy the token before closing this dialog as it won&apos;t be readable anymore afterwards.
					</Alert>
				</Paper>
				<Group position="right" mt="lg">
					<Button variant="subtle" onClick={onClose}>Cancel</Button>
					<Button type="submit">Save</Button>
				</Group>
			</form>
		</Modal>
	);
}
