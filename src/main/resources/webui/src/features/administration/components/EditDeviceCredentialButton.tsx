import api, { DeviceCredentialPayload } from "@/api"
import { PASSWORD_UNCHANGED } from "@/components/FormControl"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { CredentialSet, CredentialSetType, PropsWithRenderItem } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
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
    const values: Partial<DeviceCredentialForm> = {
      name: credential?.name,
      mgmtDomain: null,
      type: credential.type,
    }

    if (credential.mgmtDomain) {
      Object.assign(values, {
        mgmtDomain: credential.mgmtDomain.id,
      })
    }

    if (
      credential.type === CredentialSetType.SNMP_V1 ||
      credential.type === CredentialSetType.SNMP_V2C
    ) {
      Object.assign(values, {
        community: credential.community,
      })
    } else if (credential.type === CredentialSetType.SNMP_V3) {
      Object.assign(values, {
        username: credential.username,
        authType: credential.authType,
        authKey: PASSWORD_UNCHANGED,
        privType: credential.privType,
        privKey: PASSWORD_UNCHANGED,
      })
    } else if (
      credential.type === CredentialSetType.SSH ||
      credential.type === CredentialSetType.Telnet
    ) {
      Object.assign(values, {
        username: credential.username,
        password: PASSWORD_UNCHANGED,
        superPassword: PASSWORD_UNCHANGED,
      })
    } else if (credential.type === CredentialSetType.SSHKey) {
      Object.assign(values, {
        username: credential.username,
        privateKey: PASSWORD_UNCHANGED,
        password: PASSWORD_UNCHANGED,
        superPassword: PASSWORD_UNCHANGED,
      })
    }

    return values
  }, [credential])

  const form = useForm<DeviceCredentialForm>({
    mode: "onChange",
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues])

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
      title: t("credential.edit"),
      description: <AdministrationDeviceCredentialForm freezeType freezePasswords />,
      form,
      size: "lg",
      async onSubmit(values: DeviceCredentialForm) {
        const type = values.type

        const payload: Partial<DeviceCredentialPayload> = {
          name: values.name,
          mgmtDomain: null,
          type,
        }

        if (values.mgmtDomain) {
          Object.assign(payload, {
            mgmtDomain: {
              id: values.mgmtDomain,
            },
          })
        }

        if (
          type === CredentialSetType.SNMP_V1 ||
          type === CredentialSetType.SNMP_V2C
        ) {
          Object.assign(payload, {
            community: values.community,
          })
        }

        if (type === CredentialSetType.SNMP_V3) {
          const snmpPayload: Partial<DeviceCredentialPayload> = {
            username: values.username,
            authType: values.authType,
            privType: values.privType,
          }
          if (values.authKey !== PASSWORD_UNCHANGED) snmpPayload.authKey = values.authKey ?? undefined
          if (values.privKey !== PASSWORD_UNCHANGED) snmpPayload.privKey = values.privKey ?? undefined
          Object.assign(payload, snmpPayload)
        } else if (
          type === CredentialSetType.SSH ||
          type === CredentialSetType.Telnet
        ) {
          const sshPayload: Partial<DeviceCredentialPayload> = { username: values.username }
          if (values.password !== PASSWORD_UNCHANGED) sshPayload.password = values.password ?? undefined
          if (values.superPassword !== PASSWORD_UNCHANGED) sshPayload.superPassword = values.superPassword ?? undefined
          Object.assign(payload, sshPayload)
        } else if (type === CredentialSetType.SSHKey) {
          const sshKeyPayload: Partial<DeviceCredentialPayload> = {
            username: values.username,
          }
          if (values.privateKey !== PASSWORD_UNCHANGED && values.privateKey !== "") sshKeyPayload.privateKey = values.privateKey ?? undefined
          if (values.password !== PASSWORD_UNCHANGED) sshKeyPayload.password = values.password ?? undefined
          if (values.superPassword !== PASSWORD_UNCHANGED) sshKeyPayload.superPassword = values.superPassword ?? undefined
          Object.assign(payload, sshKeyPayload)
        }

        await mutation.mutateAsync(payload)

        dialogRef.close()
        form.reset()

        toast.success({
          title: t("common.success"),
          description: t("credential.successfullyUpdated", {
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
        label: t("common.applyChanges"),
      },
    })
  }

  return renderItem(open)
}
