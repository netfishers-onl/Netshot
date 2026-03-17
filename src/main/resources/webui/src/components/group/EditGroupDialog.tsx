import api, { UpdateGroupPayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { FormControl, QueryBuilderButton, QueryBuilderValue, Switch } from "@/components"
import { QUERIES } from "@/constants"
import { useDialogConfig } from "@/dialog"
import { useToast } from "@/hooks"
import { DeviceType, Group, GroupType } from "@/types"
import { Box, Button, Dialog, Heading, Portal, Separator, Stack, Tag, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo } from "react"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import DynamicGroupDeviceList from "./DynamicGroupDeviceList"
import StaticGroupDeviceList from "./StaticGroupList"

type EditGroupForm = {
  name: string
  folder: string
  visibleInReports: boolean
  staticDevices: number[]
  driver: DeviceType["name"]
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
    return t("Edit {{type}} group", {
      type: group.type === GroupType.Static ? t("static") : t("dynamic"),
    })
  }, [t, group])

  const form = useForm<EditGroupForm>({
    mode: "onChange",
    defaultValues: {
      name: group.name,
      folder: group.folder,
      visibleInReports: !group.hiddenFromReports,
      staticDevices: [],
      driver: group.driver,
      query: group.query,
    },
  })

  // Get static devices from group
  const { data: staticDevices } = useQuery({
    queryKey: [QUERIES.DEVICE_LIST, group.id, group.folder, group.name],
    queryFn: async () =>
      api.device.getAll({
        group: group.id,
      }),
  })

  useEffect(() => {
    if (staticDevices) {
      form.setValue(
        "staticDevices",
        staticDevices.map((device) => device.id)
      )
    }
  }, [staticDevices])

  const query = useWatch({
    control: form.control,
    name: "query",
  })

  const driver = useWatch({
    control: form.control,
    name: "driver",
  })

  const mutation = useMutation({
    mutationFn: async (values: EditGroupForm) => {
      let payload: UpdateGroupPayload = {
        name: values.name,
        folder: values.folder,
        hiddenFromReports: !values.visibleInReports,
      }

      if (group.type === GroupType.Static) {
        payload.staticDevices = values.staticDevices
      } else if (group.type === GroupType.Dynamic) {
        payload = {
          ...payload,
          driver: values.driver,
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

  const updateQuery = useCallback(
    (values: QueryBuilderValue) => {
      form.setValue("driver", values.driver)
      form.setValue("query", values.query)
    },
    [form]
  )

  return (
    <FormProvider {...form}>
      <Dialog.Root
        preventScroll={false}
        placement="center"
        size="xl"
        open={dialogConfig.props.isOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            dialogConfig.close()
          }
        }}
        onExitComplete={() => {
          dialogConfig.remove()
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content h="80vh" as="form" onSubmit={form.handleSubmit(submit)}>
              <Dialog.Header as="h3" fontSize="2xl" fontWeight="semibold">
                {title}
                <Dialog.CloseTrigger />
              </Dialog.Header>
              <Dialog.Body flex="1" display="flex" overflowY="auto">
                <Stack direction="row" gap="9" flex="1">
                  <Stack gap="9" w="340px" overflowY="auto">
                    <Stack gap="5">
                      <Heading as="h4" size="md">
                        {t("Information")}
                      </Heading>
                      <FormControl
                        required
                        control={form.control}
                        name="name"
                        label={t("Name")}
                        placeholder={t("Enter the group name")}
                      />
                      <FormControl
                        required
                        control={form.control}
                        name="folder"
                        label={t("Folder")}
                        placeholder={t("E.g. {{example}}", { example: t("Folder A/Subfolder B/ ...") })}
                        helperText={t("Use slashes to give a folder path")}
                      />
                      <Separator />
                      <Switch
                        label={t("Reports")}
                        description={t("Show this group in reports")}
                        control={form.control}
                        name="visibleInReports"
                      />
                    </Stack>
                    {group.type === GroupType.Dynamic && (
                      <>
                        <Separator />
                        <Stack gap="5">
                          <Stack gap="2">
                            <Heading as="h4" size="md">
                              {t("Populate")}
                            </Heading>
                            <Text color="grey.400">
                              {t("Define the search criteria to dynamically populate the group")}
                            </Text>
                          </Stack>
                          {driver && (
                            <Tag.Root colorPalette="grey" alignSelf="start">
                              {t("Device type: ")} {driver}
                            </Tag.Root>
                          )}
                          {query?.length > 0 && (
                            <Box p="3" borderWidth="1px" borderColor="grey.100" borderRadius="xl">
                              <Text fontFamily="mono">{query}</Text>
                            </Box>
                          )}
                          <QueryBuilderButton
                            value={{
                              query,
                              driver,
                            }}
                            renderItem={(open) => (
                              <Button alignSelf="start" onClick={open}>
                                {t("Edit query")}
                              </Button>
                            )}
                            onSubmit={updateQuery}
                          />
                        </Stack>
                      </>
                    )}
                  </Stack>
                  <Stack flex="1" gap="5" overflow="auto">
                    <Heading as="h4" size="md">
                      {t(
                        group.type === GroupType.Static ? "Selected devices" : "Device list preview"
                      )}
                    </Heading>
                    {group.type === GroupType.Static && <StaticGroupDeviceList />}
                    {group.type === GroupType.Dynamic && (
                      <DynamicGroupDeviceList
                        driver={driver}
                        query={query}
                        onUpdateQuery={updateQuery}
                      />
                    )}
                  </Stack>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Stack direction="row" gap="3">
                  <Button onClick={dialogConfig.close}>{t("Cancel")}</Button>
                  <Button
                    type="submit"
                    disabled={!form.formState.isValid}
                    loading={mutation.isPending}
                    variant="primary"
                  >
                    {t("Apply changes")}
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
