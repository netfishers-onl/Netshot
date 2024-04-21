import api from "@/api";
import { CreateDevicePayload } from "@/api/device";
import { NetshotError } from "@/api/httpClient";
import { DeviceTypeSelect, DomainSelect, Select, Switch } from "@/components";
import FormControl, { FormControlType } from "@/components/FormControl";
import TaskDialog from "@/components/TaskDialog";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { CredentialSetType, DeviceType, Option } from "@/types";
import { Divider, Stack, useDisclosure } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CREDENTIAL_OPTIONS } from "../constants";

type Form = {
  ipAddress: string;
  domain: Option<number>;
  autoDiscover: boolean;
  deviceType?: Option<DeviceType>;
  credentialType?: Option<CredentialSetType>;
  overrideConnectionSetting?: boolean;
  connectIpAddress?: string;
  sshPort?: string;
  telnetPort?: string;
  specificCredentialSet?: CreateDevicePayload["specificCredentialSet"];
};

export type DeviceCreateButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

function DeviceCreateForm() {
  const form = useFormContext();
  const { t } = useTranslation();

  const autoDiscover = useWatch({
    control: form.control,
    name: "autoDiscover",
  });

  const overrideConnectionSetting = useWatch({
    control: form.control,
    name: "overrideConnectionSetting",
  });

  const credentialType = useWatch({
    control: form.control,
    name: "credentialType.value",
  });

  // When autodiscover changes reset fields
  useEffect(() => {
    form.setValue(
      "credentialType",
      autoDiscover ? null : CREDENTIAL_OPTIONS[0]
    );
    form.setValue("overrideConnectionSetting", false);
    form.setValue("deviceType", null);
  }, [autoDiscover]);

  // When credential type changes reset all relative field
  useEffect(() => {
    form.setValue("specificCredentialSet.username", "");
    form.setValue("specificCredentialSet.publicKey", "");
    form.setValue("specificCredentialSet.privateKey", "");
    form.setValue("specificCredentialSet.password", "");
    form.setValue("specificCredentialSet.superPassword", "");
  }, [credentialType]);

  // When override connection setting changes reset all relative field
  useEffect(() => {
    form.setValue("connectIPAddress", "");
    form.setValue("sshPort", "");
    form.setValue("telnetPort", "");
  }, [overrideConnectionSetting]);

  return (
    <Stack spacing="6">
      <DomainSelect isRequired control={form.control} name="domain" />
      <FormControl
        isRequired
        label={t("IP Address")}
        placeholder={t("Device IP address")}
        control={form.control}
        name="ipAddress"
        rules={{
          pattern: {
            value:
              /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
            message: t("This is not a valid IP address"),
          },
        }}
      />
      <Divider />
      <Switch
        label={t("Autodiscover")}
        description={t("Automatically discover device type")}
        control={form.control}
        name="autoDiscover"
      />
      {!autoDiscover && (
        <>
          <DeviceTypeSelect
            isRequired
            control={form.control}
            name="deviceType"
          />
          <Divider />
          <Switch
            label={t("Override connection")}
            description={t("Replace default connection settings")}
            control={form.control}
            name="overrideConnectionSetting"
          />
          {overrideConnectionSetting && (
            <>
              <FormControl
                isRequired
                label={t("Connect IP")}
                placeholder={t("e.g. 10.204.5.3.0")}
                control={form.control}
                name="connectIpAddress"
                rules={{
                  pattern: {
                    value:
                      /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
                    message: t("This is not a valid IP address"),
                  },
                }}
              />
              <Stack direction="row" spacing="4">
                <FormControl
                  isRequired
                  label={t("SSH port")}
                  placeholder={t("e.g. 22")}
                  control={form.control}
                  name="sshPort"
                />
                <FormControl
                  isRequired
                  label={t("Telnet port")}
                  placeholder={t("e.g. 6753")}
                  control={form.control}
                  name="telnetPort"
                />
              </Stack>
            </>
          )}
          <Divider />
          <Select
            control={form.control}
            name="credentialType"
            options={CREDENTIAL_OPTIONS}
            label={t("Credential")}
            placeholder={t("Select a credential")}
            isRequired
          />
          {[CredentialSetType.SSH, CredentialSetType.Telnet].includes(
            credentialType
          ) && (
            <>
              <FormControl
                isRequired
                label={t("Username")}
                placeholder={t("e.g. admin")}
                control={form.control}
                name="specificCredentialSet.username"
              />
              <FormControl
                isRequired
                type={FormControlType.Password}
                label={t("Password")}
                placeholder={t("Type your password")}
                control={form.control}
                name="specificCredentialSet.password"
              />
              <FormControl
                isRequired
                type={FormControlType.Password}
                label={t("Super password")}
                placeholder={t("Type your super password")}
                control={form.control}
                name="specificCredentialSet.superPassword"
              />
            </>
          )}

          {credentialType === CredentialSetType.SSHKey && (
            <>
              <FormControl
                isRequired
                label={t("Username")}
                placeholder={t("e.g. admin")}
                control={form.control}
                name="specificCredentialSet.username"
              />
              <FormControl
                isRequired
                type={FormControlType.LongText}
                label={t("RSA Public Key")}
                placeholder={t("Type your public key")}
                control={form.control}
                name="specificCredentialSet.publicKey"
              />
              <FormControl
                isRequired
                type={FormControlType.LongText}
                label={t("RSA Private Key")}
                placeholder={t("Type your private key")}
                control={form.control}
                name="specificCredentialSet.privateKey"
              />
              <FormControl
                isRequired
                type={FormControlType.Password}
                label={t("Passphrase")}
                placeholder={t("Type your passphrase")}
                control={form.control}
                name="specificCredentialSet.password"
              />
              <FormControl
                isRequired
                type={FormControlType.Password}
                label={t("Super password")}
                placeholder={t("Type your super password")}
                control={form.control}
                name="specificCredentialSet.superPassword"
              />
            </>
          )}
        </>
      )}
    </Stack>
  );
}

export default function DeviceCreateButton(props: DeviceCreateButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);

  const form = useForm<Form>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      ipAddress: "",
      domain: null,
      autoDiscover: true,
      overrideConnectionSetting: false,
      connectIpAddress: "",
      sshPort: "",
      telnetPort: "",
      deviceType: null,
      credentialType: null,
      specificCredentialSet: {
        username: "",
        publicKey: "",
        privateKey: "",
        password: "",
        superPassword: "",
      },
    },
  });

  const mutation = useMutation(
    async (payload: CreateDevicePayload) => api.device.create(payload),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (data: Form) => {
      let newDevice = {
        deviceType: data?.deviceType?.value?.name,
        autoDiscoveryTask: -1,
        autoDiscover: data.autoDiscover,
        ipAddress: data?.ipAddress,
        domainId: data?.domain?.value,
      } as CreateDevicePayload;

      if (data.overrideConnectionSetting) {
        newDevice = {
          ...newDevice,
          connectIpAddress: data.connectIpAddress,
          sshPort: data.sshPort,
          telnetPort: data.telnetPort,
        };
      }

      if (data?.credentialType !== null) {
        if (data.credentialType.value !== null) {
          const { username, password, superPassword } =
            data.specificCredentialSet;

          newDevice.specificCredentialSet = {
            type: data.credentialType.value,
            username,
            password,
            superPassword,
          };

          if (data.credentialType.value === CredentialSetType.SSHKey) {
            const { publicKey, privateKey } = data.specificCredentialSet;

            newDevice.specificCredentialSet = {
              ...newDevice.specificCredentialSet,
              publicKey,
              privateKey,
            };
          }
        }
      }

      const task = await mutation.mutateAsync(newDevice);

      dialog.close();
      setTaskId(task?.id);
      disclosure.onOpen();
    },
    [mutation, disclosure]
  );

  const dialog = Dialog.useForm({
    title: t("Add device"),
    description: <DeviceCreateForm />,
    form,
    isLoading: mutation.isLoading,
    onSubmit,
    size: "xl",
    submitButton: {
      label: t("Add"),
    },
  });

  return (
    <>
      {renderItem(dialog.open)}
      {taskId && <TaskDialog id={taskId} {...disclosure} />}
    </>
  );
}
