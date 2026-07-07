import api, { UpdateGroupPayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { FormControl, Switch } from "@/components"
import { QUERIES } from "@/constants"
import { useDialogConfig } from "@/dialog"
import { useToast } from "@/hooks"
import { Group, GroupType, SimpleDevice } from "@/types"
import { Button, CloseButton, Dialog, Heading, Portal, Separator, Stack } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import DynamicGroupForm from "./DynamicGroupForm"
import StaticGroupForm from "./StaticGroupForm"

type EditGroupForm = {
  name: string
  folder: string
  visibleInReports: boolean
  staticDevices: SimpleDevice[]
  query: string
}

export type EditGroupDialogProps = {
  group: Group
}

export default function EditGroupDialog(props: EditGroupDialogProps) {
  const { group } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const dialogConfig = useDialogConfig()

  const title = useMemo(() => {
    return t("group.edit", {
      type: group.type === GroupType.Static ? t("group.type.static") : t("group.type.dynamic"),
    })
  }, [t, group])

  const form = useForm<EditGroupForm>({
    mode: "onChange",
    defaultValues: {
      name: group.name,
      folder: group.folder,
      visibleInReports: !group.hiddenFromReports,
      staticDevices: [],
      query: group.query,
    },
  })

  const { data: staticDevices } = useQuery({
    queryKey: [QUERIES.DEVICE_LIST, group.id, group.folder, group.name],
    queryFn: async () =>
      api.device.getAll({
        group: group.id,
      }),
  })

  useEffect(() => {
    if (staticDevices) {
      form.setValue("staticDevices", staticDevices)
    }
  }, [staticDevices])

  const mutation = useMutation({
    mutationFn: async (values: EditGroupForm) => {
      let payload: UpdateGroupPayload = {
        name: values.name,
        folder: values.folder,
        hiddenFromReports: !values.visibleInReports,
      }

      if (group.type === GroupType.Static) {
        payload.staticDevices = values.staticDevices.map((d) => d.id)
      } else if (group.type === GroupType.Dynamic) {
        payload = {
          ...payload,
          query: values.query,
        }
      }

      await api.group.update(group.id, payload)
    },
    onSuccess() {
      dialogConfig.close()
      queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_GROUPS] })
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const submit = useCallback((values: EditGroupForm) => {
    mutation.mutate(values)
  }, [])

  return (
    <FormProvider {...form}>
      <Dialog.Root
        preventScroll={false}
        placement="center"
        open={dialogConfig.props.isOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            dialogConfig.close()
          }
        }}
        onExitComplete={() => {
          dialogConfig.remove()
        }}
        size="6xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content h="80vh" as="form" onSubmit={form.handleSubmit(submit)}>
              <Dialog.Header as="h3" fontSize="2xl" fontWeight="semibold">
                {title}
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" variant="outline" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body flex="1" display="flex" overflowY="auto">
                <Stack direction="row" gap="9" flex="1">
                  <Stack gap="5" w="340px" overflowY="auto">
                    <Heading as="h4" size="md">
                      {t("common.information")}
                    </Heading>
                    <FormControl
                      required
                      control={form.control}
                      name="name"
                      label={t("common.name")}
                      placeholder={t("group.enterName")}
                    />
                    <FormControl
                      required
                      control={form.control}
                      name="folder"
                      label={t("common.folder")}
                      placeholder={t("common.eG", { example: t("group.folderExample") })}
                      helperText={t("group.useSlashesForFolder")}
                    />
                    <Separator />
                    <Switch
                      label={t("report.list")}
                      description={t("group.showInReports")}
                      control={form.control}
                      name="visibleInReports"
                    />
                  </Stack>
                  {group.type === GroupType.Static && <StaticGroupForm />}
                  {group.type === GroupType.Dynamic && <DynamicGroupForm />}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Stack direction="row" gap="3">
                  <Button onClick={dialogConfig.close}>{t("common.cancel")}</Button>
                  <Button
                    type="submit"
                    disabled={!form.formState.isValid}
                    loading={mutation.isPending}
                    variant="primary"
                  >
                    {t("common.applyChanges")}
                  </Button>
                </Stack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </FormProvider>
  )
}
