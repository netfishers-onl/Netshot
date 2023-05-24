import { Button, Chip, Collapse, Group, Input, Modal, ModalProps, Paper, Switch, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { AxiosError } from "axios";
import { useCallback, useEffect } from "react";
import { HookTriggerRestApiView, WebHook, WebHookActionEnum } from "../api";
import { Api, HTTP_URL_REGEXP, SerializableSet } from "../apiUtils";


interface EditHookModalProps extends ModalProps {
	hook: WebHook | undefined | null,
	onRefresh: () => void,
}

const POSSIBLE_TRIGGERS: Array<HookTriggerRestApiView & { description: string }> = [{
	type: "POST_TASK",
	item: "TakeSnapshotTask",
	description: "After device snapshot",
}, {
	type: "POST_TASK",
	item: "RunDeviceScriptTask",
	description:  "After JS script executed on device",
}, {
	type: "POST_TASK",
	item: "RunDiagnosticsTask",
	description: "After diagnostics performed on device",
}];

export function EditHookModal({ hook, onRefresh, opened, onClose, ...rest }: EditHookModalProps) {

	const hookForm = useForm<WebHook>({
		initialValues: {
			id: undefined,
			name: "",
			type: "Web",
			sslValidation: true,
			enabled: true,
			action: "POST_JSON",
			triggers: new SerializableSet<HookTriggerRestApiView>([{
				type: "POST_TASK",
				item: "TakeSnapshotTask",
			}]),
			url: "",
		},
		validate: {
			url: (value) => (value && value.match(HTTP_URL_REGEXP) ? null : "Invalid URL"),
		},
	});

	const handleFormSubmit = useCallback(async (newHook: WebHook) => {
		// Workaround to ensure triggers will be serialized as an array
		if (!(newHook.triggers instanceof SerializableSet)) {
			newHook.triggers = new SerializableSet(newHook.triggers);
		}
		try {
			if (typeof newHook.id === "number") {
				// Update
				await Api.admin.setHook(newHook.id, newHook);
			}
			else {
				// Create
				await Api.admin.addHook(newHook);
			}
			onClose();
			onRefresh();
		}
		catch (error: unknown) {
			let message = "Unable to save the hook.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while saving the hook: ${error.response.data.errorMsg}`
			}
			showNotification({
				id: "admin-hook-edit",
				autoClose: 5000,
				title: (typeof newHook.id === "number") ? "Hook edition" : "Hook creation",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh]);

	useEffect(() => {
		if (hook) {
			hookForm.setValues(hook);
		}
		else if (!opened) {
			// Reset data when closing the modal
			hookForm.reset();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened]);

	return (
		<Modal
			title={hook ? "Edit hook" : "Add hook"}
			opened={opened}
			onClose={onClose}
			closeOnClickOutside={false}
			size={500}
			{...rest}
		>
			<form onSubmit={hookForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<TextInput
						label="Name"
						placeholder="Name"
						required
						autoComplete="new-name"
						{...hookForm.getInputProps("name")}
						mb="md"
					/>
					<Switch
						label="Enabled"
						checked={hookForm.values.enabled}
						onChange={(event) => {
							hookForm.setFieldValue("enabled", event.currentTarget.checked);
						}}
						mb="md"
					/>
					<Input.Wrapper label="Active triggers" mt="md" mb="md">
						{POSSIBLE_TRIGGERS.map(possibleTrigger => (
							<Switch
								key={possibleTrigger.item}
								mb="xs"
								ml="sm"
								label={possibleTrigger.description}
								checked={hookForm.values.triggers &&
									!!Array.from(hookForm.values.triggers).find((t) =>
										t.item === possibleTrigger.item && t.type === possibleTrigger.type)}
								onChange={(event) => {
									const triggers = new SerializableSet<HookTriggerRestApiView>(hookForm.values.triggers);
									if (event.currentTarget.checked) {
										triggers.add({
											item: possibleTrigger.item,
											type: possibleTrigger.type,
										});
									}
									else {
										const t = Array.from(triggers).find((t) =>
											t.item === possibleTrigger.item && t.type === possibleTrigger.type);
										if (t) {
											triggers.delete(t);
										}
									}
									hookForm.setFieldValue("triggers", triggers);
								}}
							/>
						))}
					</Input.Wrapper>
					<Input.Wrapper label="Action" mt="md" mb="md" required>
						<Chip.Group
							value={hookForm.values.action}
							onChange={v => hookForm.setFieldValue("action", v as WebHookActionEnum)}
						>
							<Chip value="POST_JSON">POST JSON</Chip>
							<Chip value="POST_XML">POST XML</Chip>
						</Chip.Group>
					</Input.Wrapper>
					<TextInput
						label="URL to call"
						placeholder="https://..."
						required
						autoComplete="new-url"
						{...hookForm.getInputProps("url")}
					/>
					<Collapse in={hookForm.values.url?.startsWith("https") || false}>
						<Switch
							label="SSL validation (strongly recommended)"
							mt="md"
							checked={hookForm.values.sslValidation}
							onChange={(event) => hookForm.setFieldValue("sslValidation", event.currentTarget.checked)}
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
