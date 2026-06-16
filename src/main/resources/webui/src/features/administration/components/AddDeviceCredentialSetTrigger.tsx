import api, { DeviceCredentialPayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSetType } from "@/types"
import { getAnyOption } from "@/utils"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import { QUERIES } from "../constants"
import { useDeviceCredentialSetTypeOptions } from "../hooks"
import DeviceCredentialSetFormComponent, {
  DeviceCredentialSetForm,
} from "./DeviceCredentialSetForm"

export type AddDeviceCredentialSetTriggerProps = { children: React.ReactElement<any> } & Record<string, unknown>

export default function AddDeviceCredentialSetTrigger({ children, ...rest }: AddDeviceCredentialSetTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const anyOption = getAnyOption(t)
  const deviceCredentialSetTypeOptions = useDeviceCredentialSetTypeOptions()
  const dialog = useFormDialogWithMutation()

  const form = useForm<DeviceCredentialSetForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      username: "",
      mgmtDomain: null,
      community: "",
      type: deviceCredentialSetTypeOptions.getFirst()?.value,
      authKey: "",
      privKey: "",
      password: "",
      superPassword: "",
      privateKey: "",
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_CREDENTIAL_SET_CREATE,
    mutationFn: async (payload: Partial<DeviceCredentialPayload>) =>
      api.admin.createCredentialSet(payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_CREDENTIAL_SET_CREATE, {
      title: t("credential.create"),
      description: <DeviceCredentialSetFormComponent />,
      form,
      size: "lg",
      async onSubmit(values) {
        const type = values.type

        let payload: Partial<DeviceCredentialPayload> = {
          name: values.name,
          type,
        }

        if (
          type === CredentialSetType.SNMP_V1 ||
          type === CredentialSetType.SNMP_V2C
        ) {
          payload = {
            ...payload,
            community: values.community,
          }
        }

        if (values.mgmtDomain !== anyOption.value) {
          payload.mgmtDomain = {
            id: values.mgmtDomain,
          }
        }

        if (type === CredentialSetType.SNMP_V3) {
          payload = {
            ...payload,
            username: values.username,
            authType: values.authType,
            authKey: values.authKey,
            privType: values.privType,
            privKey: values.privKey,
          }
        } else if (type === CredentialSetType.SSH || type === CredentialSetType.Telnet) {
          payload = {
            ...payload,
            username: values.username,
            password: values.password,
            superPassword: values.superPassword,
          }
        } else if (type === CredentialSetType.SSHKey) {
          payload = {
            ...payload,
            username: values.username,
            privateKey: values.privateKey,
            password: values.password,
            superPassword: values.superPassword,
          }
        }

        await mutation.mutateAsync(payload)

        dialogRef.close()

        toast.success({
          title: t("common.success"),
          description: t("credential.successfullyCreated", {
            name: values.name,
          }),
        })

        form.reset()

        queryClient.invalidateQueries({
          queryKey: [QUERIES.ADMIN_DEVICE_CREDENTIALS],
        })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("common.create"),
      },
    })
  }

  return React.cloneElement(children, { onClick: open, onSelect: open, ...rest })
}
