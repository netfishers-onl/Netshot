import { DomainSelect, FormControl, Select } from "@/components";
import { FormControlType } from "@/components/FormControl";
import { CredentialSetType, HashingAlgorithm, Option } from "@/types";
import { Stack } from "@chakra-ui/react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  DEVICE_CREDENTIAL_AUTH_TYPE_OPTIONS,
  DEVICE_CREDENTIAL_PRIVATE_KEY_TYPE_OPTIONS,
  DEVICE_CREDENTIAL_TYPE_OPTIONS,
} from "../constants";

export type DeviceCredentialForm = {
  name: string;
  mgmtDomain: Option<number>;
  community: string;
  type: Option<CredentialSetType>;
  authKey?: string;
  authType?: Option<HashingAlgorithm>;
  privKey?: string;
  privType?: Option<HashingAlgorithm>;
  username?: string;
  password?: string;
  superPassword?: string;
  publicKey?: string;
  privateKey?: string;
};

export default function AdministrationDeviceCredentialForm() {
  const form = useFormContext<DeviceCredentialForm>();
  const { t } = useTranslation();

  const type = useWatch({
    control: form.control,
    name: "type.value",
  });

  return (
    <Stack spacing="6">
      <FormControl
        label={t("Name")}
        placeholder={t("e.g. credential name")}
        isRequired
        control={form.control}
        name="name"
      />
      <DomainSelect
        isRequired
        control={form.control}
        name="mgmtDomain"
        label={t("Domain")}
        withAny
      />
      <Select
        isRequired
        control={form.control}
        name="type"
        options={DEVICE_CREDENTIAL_TYPE_OPTIONS}
        label={t("Protocol")}
      />

      {type === CredentialSetType.SNMP_V3 && (
        <>
          <FormControl
            label={t("Username")}
            placeholder={t("e.g. admin")}
            isRequired
            control={form.control}
            name="username"
          />
          <Select
            control={form.control}
            name="authType"
            options={DEVICE_CREDENTIAL_AUTH_TYPE_OPTIONS}
            label={t("Auth type")}
          />
          <FormControl
            type={FormControlType.Password}
            label={t("Auth key")}
            placeholder={t("e.g. secret key")}
            isRequired
            control={form.control}
            name="authKey"
          />
          <Select
            control={form.control}
            name="privType"
            options={DEVICE_CREDENTIAL_PRIVATE_KEY_TYPE_OPTIONS}
            label={t("Priv type")}
          />
          <FormControl
            type={FormControlType.Password}
            label={t("Key")}
            placeholder={t("e.g. secret key")}
            isRequired
            control={form.control}
            name="privKey"
          />
        </>
      )}

      {[CredentialSetType.SSH, CredentialSetType.Telnet].includes(type) && (
        <>
          <FormControl
            isRequired
            label={t("Username")}
            placeholder={t("e.g. admin")}
            control={form.control}
            name="username"
          />
          <FormControl
            isRequired
            type={FormControlType.Password}
            label={t("Password")}
            placeholder={t("Type your password")}
            control={form.control}
            name="password"
          />
          <FormControl
            isRequired
            type={FormControlType.Password}
            label={t("Super password")}
            placeholder={t("Type your super password")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}

      {type === CredentialSetType.SSHKey && (
        <>
          <FormControl
            isRequired
            label={t("Username")}
            placeholder={t("e.g. admin")}
            control={form.control}
            name="username"
          />
          <FormControl
            isRequired
            type={FormControlType.LongText}
            label={t("RSA Public Key")}
            placeholder={t("Type your public key")}
            control={form.control}
            name="publicKey"
          />
          <FormControl
            isRequired
            type={FormControlType.LongText}
            label={t("SSH Private Key")}
            placeholder={t("Type your private key")}
            control={form.control}
            name="privateKey"
          />
          <FormControl
            isRequired
            type={FormControlType.Password}
            label={t("Passphrase")}
            placeholder={t("Type your passphrase")}
            control={form.control}
            name="password"
          />
          <FormControl
            isRequired
            type={FormControlType.Password}
            label={t("Super password")}
            placeholder={t("Type your super password")}
            control={form.control}
            name="superPassword"
          />
        </>
      )}

      {[
        CredentialSetType.SNMP_V1,
        CredentialSetType.SNMP_V2,
        CredentialSetType.SNMP_V2C,
      ].includes(type) && (
        <FormControl
          label={t("Community")}
          placeholder={t("e.g. public")}
          isRequired
          control={form.control}
          name="community"
        />
      )}
    </Stack>
  );
}
