import api, { DeviceCredentialPayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ANY_OPTION } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { CredentialSetType } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DEVICE_CREDENTIAL_TYPE_OPTIONS, QUERIES } from "../constants";
import AdministrationDeviceCredentialForm, {
  DeviceCredentialForm,
} from "./AdministrationDeviceCredentialForm";

export type AddDeviceCredentialButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddDeviceCredentialButton(
  props: AddDeviceCredentialButtonProps
) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DeviceCredentialForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      mgmtDomain: ANY_OPTION,
      community: "public",
      type: DEVICE_CREDENTIAL_TYPE_OPTIONS[0],
    },
  });

  const mutation = useMutation(
    async (payload: Partial<DeviceCredentialPayload>) =>
      api.admin.createCredentialSet(payload),
    {
      onSuccess(res) {
        const { name } = form.getValues();

        dialog.close();
        form.reset();

        toast.success({
          title: t("Success"),
          description: t(
            "Device credential {{name}} has been successfully created",
            {
              name,
            }
          ),
        });

        queryClient.invalidateQueries([QUERIES.ADMIN_DEVICE_CREDENTIALS]);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onSubmit = useCallback(
    async (values: DeviceCredentialForm) => {
      const type = values.type.value;

      let payload: Partial<DeviceCredentialPayload> = {
        name: values.name,
        type,
      };

      if (
        type === CredentialSetType.SNMP_V1 ||
        type === CredentialSetType.SNMP_V2 ||
        type === CredentialSetType.SNMP_V2C
      ) {
        payload = {
          ...payload,
          community: values.community,
        };
      }

      if (values.mgmtDomain.value !== ANY_OPTION.value) {
        payload.mgmtDomain = {
          id: values.mgmtDomain.value,
        };
      }

      if (type === CredentialSetType.SNMP_V3) {
        payload = {
          ...payload,
          username: values.username,
          authType: values.authType.value,
          authKey: values.authKey,
          privType: values.privType.value,
          privKey: values.privKey,
        };
      } else if (
        type === CredentialSetType.SSH ||
        type === CredentialSetType.Telnet
      ) {
        payload = {
          ...payload,
          username: values.username,
          password: values.password,
          superPassword: values.superPassword,
        };
      } else if (type === CredentialSetType.SSHKey) {
        payload = {
          ...payload,
          username: values.username,
          publicKey: values.publicKey,
          privateKey: values.privateKey,
          password: values.password,
          superPassword: values.superPassword,
        };
      }

      mutation.mutate(payload);
    },
    [mutation]
  );

  const dialog = Dialog.useForm({
    title: t("Create credential"),
    description: <AdministrationDeviceCredentialForm />,
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Create"),
    },
  });

  return renderItem(dialog.open);
}
