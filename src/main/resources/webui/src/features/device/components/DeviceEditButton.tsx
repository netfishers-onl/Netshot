import api, { UpdateDevicePayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Checkbox, DomainSelect, Select } from "@/components";
import FormControl, { FormControlType } from "@/components/FormControl";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { CredentialSetType, Device, Option } from "@/types";
import { Checkbox as NativeCheckbox, Stack } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CREDENTIAL_OPTIONS } from "../constants";
import { QUERIES } from "@/constants";

export type DeviceEditButtonProps = {
  device: Device;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

type Form = {
  name: string;
  ipAddress: string;
  mgmtDomain: Option<number>;
  // Override connection settings
  overrideConnectionSetting: boolean;
  connectIpAddress: string;
  sshPort: string;
  telnetPort: string;
  credentialType: Option<CredentialSetType>;
  // netshot SNMP, SSH, Fake SNMP, Fake SSH
  credentialSetIds: number[];
  specificCredentialSet: UpdateDevicePayload["specificCredentialSet"];
  // In case of failure, also try all known credentials
  autoTryCredentials: boolean;
  comments: string;
};

function DeviceEditForm() {
  const form = useFormContext();
  const { t } = useTranslation();

  const { data: credentialSets, isPending } = useQuery({
    queryKey: [QUERIES.CREDENTIAL_SET_LIST],
    queryFn: async () =>
      api.admin.getAllCredentialSets({
        offset: 0,
        limit: 999,
      })
  });

  const overrideConnectionSetting = useWatch({
    control: form.control,
    name: "overrideConnectionSetting",
  });

  const credentialType = useWatch({
    control: form.control,
    name: "credentialType.value",
  });

  const credentialSetIds = useWatch({
    control: form.control,
    name: "credentialSetIds",
  });

  const toggleCredentialSetId = useCallback(
    (id: number) => {
      const ids = [...credentialSetIds];
      const index = credentialSetIds.findIndex((i) => i === id);

      if (index !== -1) {
        ids.splice(index, 1);
      } else {
        ids.push(id);
      }

      form.setValue("credentialSetIds", ids);
    },
    [credentialSetIds]
  );

  // When credential type changes reset all relative field
  const onCredentialTypeChange = useCallback(() => {
    form.setValue("specificCredentialSet", {
      username: "",
      password: "",
      superPassword: "",
      publicKey: "",
      privateKey: "",
    });
  }, [form]);

  // When override connection setting changes reset all relative field
  useEffect(() => {
    if (overrideConnectionSetting) return;

    form.setValue("connectIpAddress", "");
    form.setValue("sshPort", "");
    form.setValue("telnetPort", "");
  }, [overrideConnectionSetting]);

  const isSshOrTelnet = useMemo(
    () =>
      [CredentialSetType.SSH, CredentialSetType.Telnet].includes(
        credentialType
      ),
    [credentialType]
  );

  return (
    <Stack spacing="6" px="6">
      <FormControl
        isReadOnly
        label={t("Name")}
        placeholder={t("Device name")}
        control={form.control}
        name="name"
      />
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
      <DomainSelect control={form.control} name="mgmtDomain" />
      <Checkbox control={form.control} name="overrideConnectionSetting">
        {t("Override connection settings")}
      </Checkbox>
      {overrideConnectionSetting && (
        <>
          <FormControl
            isRequired
            label={t("Connect IP")}
            placeholder={t("e.g. 10.216.5.3")}
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
      <Select
        control={form.control}
        name="credentialType"
        options={CREDENTIAL_OPTIONS}
        label={t("Credential")}
        placeholder={t("Select a credential")}
        onChange={onCredentialTypeChange}
      />
      {credentialType === null && !isPending && (
        <>
          <Stack spacing="2">
            {credentialSets.map((credentialSet) => (
              <NativeCheckbox
                defaultValue={credentialSetIds.includes(credentialSet?.id)}
                onChange={() => toggleCredentialSetId(credentialSet?.id)}
                key={credentialSet?.id}
                isChecked={credentialSetIds.includes(credentialSet?.id)}
              >
                {credentialSet?.name} ({credentialSet?.type})
              </NativeCheckbox>
            ))}
            <Checkbox control={form.control} name="autoTryCredentials">
              {t("In case of failure, also try all known credentials")}
            </Checkbox>
          </Stack>
        </>
      )}

      {isSshOrTelnet && (
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
            type={FormControlType.Password}
            label={t("Super password")}
            placeholder={t("Type your super password")}
            control={form.control}
            name="specificCredentialSet.superPassword"
          />
        </>
      )}

      <FormControl
        type={FormControlType.LongText}
        label={t("Comments")}
        placeholder={t("Add description about the device")}
        control={form.control}
        name="comments"
      />
    </Stack>
  );
}

export default function DeviceEditButton(props: DeviceEditButtonProps) {
  const { device, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => {
    const credentialType = CREDENTIAL_OPTIONS.find((option) => {
      if (device?.specificCredentialSet === null) {
        return option;
      }

      return option.value === device?.specificCredentialSet?.type;
    });

    const overrideConnectionSetting = Boolean(
      device?.connectAddress && device?.sshPort && device?.telnetPort
    );

    const values = {
      name: device?.name,
      ipAddress: device?.mgmtAddress,
      mgmtDomain: {
        label: device?.mgmtDomain?.name,
        value: device?.mgmtDomain?.id,
      },
      overrideConnectionSetting,
      connectIpAddress: device?.connectAddress ?? "",
      sshPort: device?.sshPort?.toString() ?? "",
      telnetPort: device?.telnetPort?.toString() ?? "",
      autoTryCredentials: device?.autoTryCredentials,
      credentialSetIds: device?.credentialSetIds ?? [],
      credentialType,
      comments: device?.comments ?? "",
      specificCredentialSet: {
        username: device?.specificCredentialSet?.username ?? "",
        publicKey: device?.specificCredentialSet?.publicKey ?? "",
        privateKey: device?.specificCredentialSet?.privateKey ?? "",
        password: device?.specificCredentialSet?.password ?? "",
        superPassword: device?.specificCredentialSet?.superPassword ?? "",
      },
    } as Form;

    return values;
  }, [device]);

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(device?.id, payload),
    onSuccess() {
      dialog.close();
      toast.success({
        title: t("Success"),
        description: t("Device {{device}} has been successfully modified", {
          device: device?.name,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: [QUERIES.DEVICE_DETAIL, +device?.id],
      });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (data: Form) => {
      let updatedDevice: Partial<UpdateDevicePayload> = {
        comments: data?.comments,
        ipAddress: data?.ipAddress,
        mgmtDomain: data?.mgmtDomain?.value,
        credentialSetIds: data?.credentialSetIds,
        autoTryCredentials: data?.autoTryCredentials,
      };

      if (data.overrideConnectionSetting) {
        updatedDevice = {
          ...updatedDevice,
          connectIpAddress: data?.connectIpAddress,
          sshPort: data?.sshPort,
          telnetPort: data?.telnetPort,
        };
      }

      if (data.credentialType.value !== null) {
        const { username, password, superPassword } =
          data.specificCredentialSet;

        updatedDevice.specificCredentialSet = {
          type: data.credentialType.value,
          username,
          password,
          superPassword,
        };

        if (data.credentialType.value === CredentialSetType.SSHKey) {
          const { publicKey, privateKey } = data.specificCredentialSet;

          updatedDevice.specificCredentialSet = {
            ...updatedDevice.specificCredentialSet,
            publicKey,
            privateKey,
          };
        }
      }

      mutation.mutate(updatedDevice);
    },
    [device, mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Edit device"),
    description: <DeviceEditForm />,
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    variant: "floating",
    onSubmit,
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}
