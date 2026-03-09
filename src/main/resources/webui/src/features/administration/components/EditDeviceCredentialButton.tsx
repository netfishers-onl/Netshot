import api, { DeviceCredentialPayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSet, CredentialSetType, PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import AdministrationDeviceCredentialForm, {
  DeviceCredentialForm,
} from "./AdministrationDeviceCredentialForm"

export type EditDeviceCredentialButtonProps = PropsWithRenderItem<{
  credential: CredentialSet
}>

export default function EditDeviceCredentialButton(props: EditDeviceCredentialButtonProps) {
  const { credential, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo(() => {
    let values: Partial<DeviceCredentialForm> = {
      name: credential?.name,
      community: credential.community,
      mgmtDomain: null,
      type: credential.type,
    }

    if (credential.mgmtDomain) {
      values.mgmtDomain = credential.mgmtDomain.id
    }

    if (credential.type === CredentialSetType.SNMP_V3) {
      values = {
        ...values,
        username: credential.username,
        authType: credential.authType,
        authKey: credential.authKey,
        privType: credential.privType,
        privKey: credential.privKey,
      }
    } else if (
      credential.type === CredentialSetType.SSH ||
      credential.type === CredentialSetType.Telnet
    ) {
      values = {
        ...values,
        username: credential.username,
        password: credential.password,
        superPassword: credential.superPassword,
      }
    } else if (credential.type === CredentialSetType.SSHKey) {
      values = {
        ...values,
        username: credential.username,
        publicKey: credential.publicKey,
        privateKey: credential.privateKey,
        password: credential.password,
        superPassword: credential.superPassword,
      }
    }

    return values
  }, [credential])

  const form = useForm<DeviceCredentialForm>({
    mode: "onChange",
    defaultValues,
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_CREDENTIAL_SET_UPDATE,
    mutationFn: async (payload: Partial<DeviceCredentialPayload>) =>
      api.admin.updateCredentialSet(credential?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_CREDENTIAL_SET_UPDATE, {
      title: t("Edit credential"),
      description: <AdministrationDeviceCredentialForm />,
      form,
      size: "lg",
      async onSubmit(values: DeviceCredentialForm) {
        const type = values.type

        let payload: Partial<DeviceCredentialPayload> = {
          name: values.name,
          mgmtDomain: {
            id: values.mgmtDomain,
          },
          type,
        }

        if (
          type === CredentialSetType.SNMP_V1 ||
          type === CredentialSetType.SNMP_V2 ||
          type === CredentialSetType.SNMP_V2C
        ) {
          payload = {
            ...payload,
            community: values.community,
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
            publicKey: values.publicKey,
            privateKey: values.privateKey,
            password: values.password,
            superPassword: values.superPassword,
          }
        }

        await mutation.mutateAsync(payload)

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("Device credential {{name}} has been successfully updated", {
            name: values.name,
          }),
        })

        queryClient.invalidateQueries({
          queryKey: [QUERIES.ADMIN_DEVICE_CREDENTIALS],
        })
      },
      onCancel() {
        form.reset()
      },
      submitButton: {
        label: t("Apply changes"),
      },
    })
  }

  return renderItem(open)
}
