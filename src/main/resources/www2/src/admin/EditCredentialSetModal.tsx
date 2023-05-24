import { useCallback, useEffect } from "react";
import { Button, Collapse, Group, Input, Modal, ModalProps,
	Paper, PasswordInput, SegmentedControl, Select, SimpleGrid, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { DeviceCredentialSetRestApiView, DeviceSnmpv1Community, DeviceSnmpv2cCommunity, DeviceSnmpv3Community,
	DeviceSshAccount, DeviceSshKeyAccount, DeviceTelnetAccount } from "../api";
import { Api } from "../apiUtils";
import { DomainSelector } from "./DomainSelector";
import { AxiosError } from "axios";
import { IconX } from "@tabler/icons-react";

type AnyCredentialSet = DeviceTelnetAccount &  DeviceSshAccount & DeviceSshKeyAccount &
		DeviceSnmpv1Community & DeviceSnmpv2cCommunity & DeviceSnmpv3Community;

interface EditCredentialSetModalProps extends ModalProps {
	credentialSet: DeviceCredentialSetRestApiView | undefined | null,
	onRefresh: () => void,
}

export function EditCredentialSetModal({ credentialSet, onRefresh, opened, onClose, ...rest }: EditCredentialSetModalProps) {

	const credentialSetForm = useForm<AnyCredentialSet>({
		initialValues: {
			id: undefined,
			type: "SSH",
			authType: "MD5",
			privType: "DES",
		},
		validate: {
		},
	});

	const handleFormSubmit = useCallback(async ({ id, name, type, mgmtDomain, username, password,
		superPassword, community, privateKey, publicKey, authType, authKey, privType,
		privKey }: AnyCredentialSet) => {
		try {
			let credSet: DeviceCredentialSetRestApiView | undefined = undefined;
			if (type === "Telnet") {
				const telnetAccount: DeviceTelnetAccount = {
					type, id, name, mgmtDomain, username, password, superPassword,
				};
				credSet = telnetAccount;
			}
			else if (type === "SSH") {
				const sshAccount: DeviceSshAccount = {
					type, id, name, mgmtDomain, username, password, superPassword,
				};
				credSet = sshAccount;
			}
			else if (type === "SSH Key") {
				const sshKeyAccount: DeviceSshKeyAccount = {
					type, id, name, mgmtDomain, username, password, superPassword,
					privateKey, publicKey,
				};
				credSet = sshKeyAccount;
			}
			else if (type === "SNMP v1") {
				const snmpv1Community: DeviceSnmpv1Community = {
					type, id, name, mgmtDomain, community,
				};
				credSet = snmpv1Community;
			}
			else if (type === "SNMP v2") {
				const snmpv2Community: DeviceSnmpv2cCommunity = {
					type, id, name, mgmtDomain, community,
				};
				credSet = snmpv2Community;
			}
			else if (type === "SNMP v3") {
				const snmpv3Community: DeviceSnmpv3Community = {
					type, id, name, mgmtDomain, username, authType, authKey, privType, privKey,
				};
				credSet = snmpv3Community;
			}
			if (credSet) {
				if (credSet.mgmtDomain) {
					credSet.mgmtDomain = { id: credSet.mgmtDomain.id };
				}
				if (typeof credSet.id === "number") {
					// Update
					await Api.admin.setCredentialSet(credSet.id, credSet);
				}
				else {
					// Create
					await Api.admin.addCredentialSet(credSet);
				}
				onClose();
				onRefresh();
			}
		}
		catch (error: unknown) {
			let message = "Unable to save the credentials.";
			if (error instanceof AxiosError && error.response && error.response.data && error.response.data.errorMsg) {
				message = `Error while saving the credentials: ${error.response.data.errorMsg}`
			}
			showNotification({
				id: "admin-credentialset-edit",
				autoClose: 5000,
				title: (typeof id === "number") ? "Credentials edition" : "Credentials creation",
				message,
				color: "red",
				icon: <IconX size={18} />,
			});
		}
	}, [onClose, onRefresh]);

	useEffect(() => {
		if (credentialSet) {
			credentialSetForm.setValues(credentialSet);
		}
		else if (!opened) {
			// Reset data when closing the modal
			credentialSetForm.reset();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [credentialSet, opened]);

	return (
		<Modal
			title={credentialSet ? "Edit credentials" : "Add credentials"}
			opened={opened}
			onClose={onClose}
			closeOnClickOutside={false}
			size={500}
			{...rest}
		>
			<form onSubmit={credentialSetForm.onSubmit(handleFormSubmit)} autoComplete="off">
				<Paper>
					<TextInput
						label="Name"
						placeholder="Name"
						required
						autoComplete="new-name"
						{...credentialSetForm.getInputProps("name")}
						mb="md"
					/>
					<DomainSelector
						selectedIds={credentialSetForm.values.mgmtDomain?.id ? [credentialSetForm.values.mgmtDomain?.id] : []}
						setSelectedIds={(ids) => {
							credentialSetForm.setFieldValue("mgmtDomain", ids.length > 0 ? { id: ids[0] } : undefined);
						}}
						maxSelectedIds={1}
						label="Device domain (clear to apply to all domains)"
						clearable
					/>
					<Input.Wrapper label="Credential type" mt="md" mb="md" required>
						<SegmentedControl
							data={["Telnet", "SSH", "SSH Key", "SNMP v1", "SNMP v2", "SNMP v3"]}
							fullWidth
							onChange={(type) => credentialSetForm.setFieldValue("type", type)}
							value={credentialSetForm.values.type}
							disabled={!!credentialSet}
						/>
					</Input.Wrapper>
					<Collapse in={!!credentialSetForm.values.type.match(/SSH|Telnet|SNMP v3/)}>
						<TextInput
							label="Username"
							placeholder="Username"
							required={!!credentialSetForm.values.type.match(/SSH|Telnet|SNMP v3/)}
							autoComplete="new-username"
							{...credentialSetForm.getInputProps("username")}
						/>
					</Collapse>
					<Collapse in={!!credentialSetForm.values.type.match(/SSH|Telnet/)}>
						<SimpleGrid cols={2}>
							<PasswordInput
								label="Password"
								placeholder="Password"
								autoComplete="new-password"
								required={!!credentialSetForm.values.type.match(/SSH|Telnet/)}
								mt="md"
								{...credentialSetForm.getInputProps("password")}
							/>
							<PasswordInput
								label="Super password"
								placeholder="Root/enable password"
								autoComplete="new-super-password"
								required={!!credentialSetForm.values.type.match(/SSH|Telnet/)}
								mt="md"
								{...credentialSetForm.getInputProps("superPassword")}
							/>
						</SimpleGrid>
					</Collapse>
					<Collapse in={!!credentialSetForm.values.type.match(/SNMP v(1|2)/)}>
						<TextInput
							label="Community"
							placeholder="SNMP community"
							required={!!credentialSetForm.values.type.match(/SNMP v(1|2)/)}
							autoComplete="new-community"
							mt="md"
							{...credentialSetForm.getInputProps("community")}
						/>
					</Collapse>
					<Collapse in={!!credentialSetForm.values.type.match(/SSH Key/)}>
						<Textarea
							label="SSH public key"
							placeholder="Paste here the public key"
							required={!!credentialSetForm.values.type.match(/SSH Key/)}
							autoComplete="new-ssh-public-key"
							minRows={3}
							mt="md"
							{...credentialSetForm.getInputProps("publicKey")}
						/>
						<Textarea
							label="SSH private key"
							placeholder="Paste here the private key"
							required={!!credentialSetForm.values.type.match(/SSH Key/)}
							autoComplete="new-ssh-private-key"
							minRows={3}
							mt="md"
							{...credentialSetForm.getInputProps("privateKey")}
						/>
					</Collapse>
					<Collapse in={!!credentialSetForm.values.type.match(/SNMP v3/)}>
						<TextInput
							label="Authentication key"
							placeholder="Auth key"
							autoComplete="new-auth-key"
							{...credentialSetForm.getInputProps("authKey")}
							mt="md"
							rightSectionWidth={100}
							type="password"
							required={!!credentialSetForm.values.type.match(/SNMP v3/)}
							rightSection={
								<Select
									data={["MD5", "SHA"]}
									value={credentialSetForm.values.authType}
									onChange={(value) => {
										if (typeof value === "string") {
											credentialSetForm.setFieldValue("authType", value)
										}
									}}
									styles={{ input: {borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } }}
								/>}
						/>
						<TextInput
							label="Privacy key"
							placeholder="Priv key"
							autoComplete="new-priv-key"
							{...credentialSetForm.getInputProps("privKey")}
							mt="md"
							rightSectionWidth={100}
							type="password"
							required={!!credentialSetForm.values.type.match(/SNMP v3/)}
							rightSection={
								<Select
									data={["DES", "AES128", "AES192", "AES256"]}
									value={credentialSetForm.values.privType}
									onChange={(value) => {
										if (typeof value === "string") {
											credentialSetForm.setFieldValue("privType", value)
										}
									}}
									styles={{ input: {borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } }}
								/>}
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
