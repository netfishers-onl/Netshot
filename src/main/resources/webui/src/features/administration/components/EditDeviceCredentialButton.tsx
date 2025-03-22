import api, { DeviceCredentialPayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { ANY_OPTION } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { CredentialSet, CredentialSetType, HashingAlgorithm } from "@/types";
import { getKeyByValue } from "@/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DEVICE_CREDENTIAL_TYPE_OPTIONS, QUERIES } from "../constants";
import AdministrationDeviceCredentialForm, {
  DeviceCredentialForm,
} from "./AdministrationDeviceCredentialForm";

export type EditDeviceCredentialButtonProps = {
  credential: CredentialSet;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function EditDeviceCredentialButton(
  props: EditDeviceCredentialButtonProps
) {
  const { credential, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const defaultValues = useMemo(() => {
    const type = DEVICE_CREDENTIAL_TYPE_OPTIONS.find(
      (option) => option.value === credential.type
    );

    let values: Partial<DeviceCredentialForm> = {
      name: credential?.name,
      community: credential.community,
      mgmtDomain: ANY_OPTION,
      type,
    };

    if (credential.mgmtDomain) {
      values.mgmtDomain = {
        label: credential.mgmtDomain.name,
        value: credential.mgmtDomain.id,
      };
    }

    if (credential.type === CredentialSetType.SNMP_V3) {
      values = {
        ...values,
        username: credential.username,
        authType: {
          label: t(getKeyByValue(HashingAlgorithm, credential.authType)),
          value: credential.authType,
        },
        authKey: credential.authKey,
        privType: {
          label: getKeyByValue(HashingAlgorithm, credential.privType),
          value: credential.privType,
        },
        privKey: credential.privKey,
      };
    } else if (
      credential.type === CredentialSetType.SSH ||
      credential.type === CredentialSetType.Telnet
    ) {
      values = {
        ...values,
        username: credential.username,
        password: credential.password,
        superPassword: credential.superPassword,
      };
    } else if (credential.type === CredentialSetType.SSHKey) {
      values = {
        ...values,
        username: credential.username,
        publicKey: credential.publicKey,
        privateKey: credential.privateKey,
        password: credential.password,
        superPassword: credential.superPassword,
      };
    }

    return values;
  }, [credential]);

  const form = useForm<DeviceCredentialForm>({
    mode: "onChange",
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (payload: Partial<DeviceCredentialPayload>) =>
      api.admin.updateCredentialSet(credential?.id, payload),
    onSuccess(res) {
      dialog.close();
      toast.success({
        title: t("Success"),
        description: t(
          "Device credential {{name}} has been successfully updated",
          {
            name: res?.name,
          }
        ),
      });

      queryClient.invalidateQueries({ queryKey: [QUERIES.ADMIN_DEVICE_CREDENTIALS] });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: DeviceCredentialForm) => {
      const type = values.type.value;

      let payload: Partial<DeviceCredentialPayload> = {
        name: values.name,
        mgmtDomain: {
          id: values.mgmtDomain.value,
        },
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
    title: t("Edit credential"),
    description: <AdministrationDeviceCredentialForm />,
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    onSubmit,
    onCancel() {
      form.reset();
    },
    submitButton: {
      label: t("Apply changes"),
    },
  });

  return renderItem(dialog.open);
}
