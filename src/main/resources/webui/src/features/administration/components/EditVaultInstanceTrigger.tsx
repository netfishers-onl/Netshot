import api from "@/api"
import { VaultInstancePayload } from "@/api/types"
import { PASSWORD_UNCHANGED } from "@/components/FormControl"
import { NetshotError } from "@/api/httpClient"
import { MUTATIONS } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { VaultInstance } from "@/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import React from "react"
import Slot from "@/components/Slot"
import { QUERIES } from "../constants"
import VaultInstanceFormComponent, {
  VaultInstanceForm,
  VaultInstanceTestConnectionButton,
  buildVaultInstancePayload,
} from "./VaultInstanceForm"

export type EditVaultInstanceTriggerProps = { vaultInstance: VaultInstance; children: React.ReactElement<Record<string, unknown>> } & Record<string, unknown>

export default function EditVaultInstanceTrigger({ vaultInstance, children, ...rest }: EditVaultInstanceTriggerProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialog = useFormDialogWithMutation()

  const defaultValues = useMemo<Partial<VaultInstanceForm>>(
    () => ({
      name: vaultInstance.name,
      type: vaultInstance.type,
      baseUrl: vaultInstance.baseUrl,
      namespace: vaultInstance.namespace ?? "",
      httpsCaTrustMode: vaultInstance.httpsCaTrustMode,
      httpsCustomCaCertificate: vaultInstance.httpsCustomCaCertificate ?? "",
      kvMountPath: vaultInstance.kvMountPath,
      authMethod: vaultInstance.authMethod,
      appRoleMountPath: vaultInstance.appRoleMountPath ?? "approle",
      appRoleId: vaultInstance.appRoleId ?? "",
      appRoleSecretId: PASSWORD_UNCHANGED,
      jwtMountPath: vaultInstance.jwtMountPath ?? "jwt",
      jwtIdpTokenEndpoint: vaultInstance.jwtIdpTokenEndpoint ?? "",
      jwtClientId: vaultInstance.jwtClientId ?? "",
      jwtClientSecret: PASSWORD_UNCHANGED,
      jwtVaultRole: vaultInstance.jwtVaultRole ?? "",
      jwtScope: vaultInstance.jwtScope ?? "",
    }),
    [vaultInstance]
  )

  const form = useForm<VaultInstanceForm>({
    mode: "onChange",
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const mutation = useMutation({
    mutationKey: MUTATIONS.ADMIN_VAULT_INSTANCE_UPDATE,
    mutationFn: async (payload: Partial<VaultInstancePayload>) =>
      api.admin.updateVaultInstance(vaultInstance.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.ADMIN_VAULT_INSTANCE_UPDATE, {
      title: t("vault.edit"),
      description: <VaultInstanceFormComponent freezeType freezeSecrets />,
      footerStart: (
        <VaultInstanceTestConnectionButton id={vaultInstance.id} freezeSecrets />
      ),
      form,
      size: "lg",
      async onSubmit(values) {
        // buildVaultInstancePayload already turns the PASSWORD_UNCHANGED (null)
        // sentinel into `undefined`, which is dropped from the JSON body -
        // consistent with the "unchanged" convention used for other secrets.
        await mutation.mutateAsync(buildVaultInstancePayload(values))

        dialogRef.close()
        form.reset()

        toast.success({
          title: t("common.success"),
          description: t("vault.successfullyUpdated", {
            name: values.name,
          }),
        })

        queryClient.invalidateQueries({
          queryKey: [QUERIES.ADMIN_VAULT_INSTANCES],
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

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
