import api, { UpdateDevicePayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Checkbox, DomainSelect } from "@/components"
import { MUTATIONS, QUERIES } from "@/constants"
import { useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Option, PropsWithRenderItem, SimpleDevice } from "@/types"
import { Alert, Field, Checkbox as NativeCheckbox, Skeleton, Stack } from "@chakra-ui/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback } from "react"
import { useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

type Form = {
  mgmtDomain: Option<number>
  credentialSetIds: number[]
}

export type DeviceBulkEditButtonProps = PropsWithRenderItem<{
  devices: SimpleDevice[]
}>

function DeviceBulkEditForm() {
  const form = useFormContext()
  const { t } = useTranslation()

  const { data: credentialSets, isPending } = useQuery({
    queryKey: [QUERIES.CREDENTIAL_SET_LIST],
    queryFn: async () =>
      api.admin.getAllCredentialSets({
        offset: 0,
        limit: 999,
      }),
  })

  const credentialSetIds = useWatch({
    control: form.control,
    name: "credentialSetIds",
  })

  const toggleCredentialSetId = useCallback(
    (id: number) => {
      const ids = [...credentialSetIds]
      const index = credentialSetIds.findIndex((i) => i === id)

      if (index !== -1) {
        ids.splice(index, 1)
      } else {
        ids.push(id)
      }

      form.setValue("credentialSetIds", ids)
    },
    [credentialSetIds]
  )

  return (
    <Stack gap="6" px="6">
      <DomainSelect control={form.control} name="mgmtDomain" />
      <Stack gap="3">
        <Field.Label>{t("Use the following credential set")}</Field.Label>
        {isPending ? (
          <Stack gap="2">
            <Skeleton w="100%" h="36px" />
            <Skeleton w="100%" h="36px" />
            <Skeleton w="100%" h="36px" />
            <Skeleton w="100%" h="36px" />
          </Stack>
        ) : (
          <Stack gap="2">
            {credentialSets.map((credentialSet) => (
              <NativeCheckbox.Root
                defaultValue={String(credentialSetIds.includes(credentialSet?.id))}
                onCheckedChange={() => toggleCredentialSetId(credentialSet?.id)}
                key={credentialSet?.id}
                checked={credentialSetIds.includes(credentialSet?.id)}
              >
                <NativeCheckbox.HiddenInput />
                <NativeCheckbox.Control />
                <NativeCheckbox.Label>
                  {credentialSet?.name} ({credentialSet?.type})
                </NativeCheckbox.Label>
              </NativeCheckbox.Root>
            ))}
            <Checkbox control={form.control} name="autoTryCredentials">
              {t("In case of failure, also try all known credentials")}
            </Checkbox>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}

export default function DeviceBulkEditButton(props: DeviceBulkEditButtonProps) {
  const { devices, renderItem } = props
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      credentialSetIds: [],
    },
  })

  const edit = useMutation({
    mutationKey: MUTATIONS.DEVICE_UPDATE,
    mutationFn: async (payload: Partial<UpdateDevicePayload>) =>
      api.device.update(payload?.id, payload),
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.DEVICE_UPDATE, {
      title: t("Edit devices"),
      description: (
        <>
          <Stack px="6" mb="6">
            <Alert.Root status="info" bg="blue.50">
              <Alert.Description color="blue.900">
                {t("The modifications will be applied to {{count}} devices", {
                  count: devices?.length,
                })}
              </Alert.Description>
            </Alert.Root>
          </Stack>
          <DeviceBulkEditForm />
        </>
      ),
      form,
      isLoading: edit.isPending,
      size: "lg",
      variant: "floating",
      async onSubmit(data: Form) {
        for await (const device of devices) {
          await edit.mutateAsync({
            id: device?.id,
            mgmtDomain: data?.mgmtDomain?.value,
            credentialSetIds: data?.credentialSetIds,
          } as Partial<UpdateDevicePayload>)
        }

        dialogRef.close()

        toast.success({
          title: t("Success"),
          description: t("{{count}} devices have been successfully modified", {
            count: devices?.length,
          }),
        })

        form.reset()
      },
      submitButton: {
        label: t("Apply changes"),
      },
    })
  }

  return renderItem(open)
}
