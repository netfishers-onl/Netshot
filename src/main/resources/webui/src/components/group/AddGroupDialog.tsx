import api, { CreateGroupPayload } from "@/api"
import { NetshotError } from "@/api/httpClient"
import {
  BoxWithIconButton,
  FormControl,
  QueryBuilderButton,
  QueryBuilderValue,
  Switch,
} from "@/components"
import { QUERIES } from "@/constants"
import { useDialogConfig } from "@/dialog"
import { useToast } from "@/hooks"
import { GroupType } from "@/types"
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  DialogRootProps,
  Heading,
  Portal,
  Separator,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import DynamicGroupDeviceList from "./DynamicGroupDeviceList"
import StaticGroupDeviceList from "./StaticGroupList"
import { AddGroupForm, FormStep } from "./types"

export default function AddGroupDialog() {
  const { t } = useTranslation()
  const toast = useToast()
  const dialogConfig = useDialogConfig()
  const queryClient = useQueryClient()
  const [groupType, setGroupType] = useState<GroupType>(null)
  const [formStep, setFormStep] = useState(FormStep.Type)
  const [size, setSize] = useState<DialogRootProps["size"]>("2xl")

  const title = useMemo(() => {
    if (formStep === FormStep.Type) {
      return t("chooseGroupType")
    }

    return t("createGroup", {
      type: groupType === GroupType.Static ? t("static") : t("dynamic"),
    })
  }, [t, formStep, groupType])

  const form = useForm<AddGroupForm>({
    mode: "onChange",
    defaultValues: {
      name: "",
      folder: "",
      visibleInReports: true,
      staticDevices: [],
      driver: null,
      query: "",
    },
  })

  const query = useWatch({
    control: form.control,
    name: "query",
  })

  const driver = useWatch({
    control: form.control,
    name: "driver",
  })

  const createMutation = useMutation({
    mutationFn: async (values: AddGroupForm) => {
      let payload: CreateGroupPayload = {
        folder: values.folder,
        name: values.name,
        type: groupType,
        hiddenFromReports: !values.visibleInReports,
      }

      if (groupType === GroupType.Static) {
        payload.staticDevices = values.staticDevices
      } else if (groupType === GroupType.Dynamic) {
        payload = {
          ...payload,
          driver: values.driver,
          query: values.query,
        }
      }

      await api.group.create(payload)
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_GROUPS] })
      close()
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  const close = () => {
    dialogConfig.close()

    // Wait modal disppeared before re-init (blink effect)
    setTimeout(() => {
      setFormStep(FormStep.Type)
      setGroupType(null)
      setSize("2xl")
      form.reset()
    }, 100)
  }

  const next = () => {
    setFormStep(FormStep.Details)
    setSize("5xl")
  }

  const submit = (values: AddGroupForm) => {
    createMutation.mutate(values)
  }

  const updateQuery = (values: QueryBuilderValue) => {
    form.setValue("driver", values.driver)
    form.setValue("query", values.query)
  }

  return (
    <FormProvider {...form}>
      <Dialog.Root
        preventScroll={false}
        placement="center"
        closeOnInteractOutside={false}
        size={size}
        open={dialogConfig.props.isOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            close()
          }
        }}
        onExitComplete={() => {
          dialogConfig.remove()
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              as="form"
              h={formStep === FormStep.Details ? "80vh" : "initial"}
              onSubmit={form.handleSubmit(submit)}
            >
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" variant="outline" />
              </Dialog.CloseTrigger>
              <Dialog.Header as="h3" fontSize="2xl" fontWeight="semibold">
                {title}
              </Dialog.Header>
              <Dialog.Body flex="1" display="flex" overflow="auto">
                {formStep === FormStep.Type && (
                  <Stack direction="row" gap="5">
                    <BoxWithIconButton
                      title={t("staticLabel")}
                      description={t("createASimpleStaticGroupOfDevices")}
                      icon="server"
                      isActive={groupType === GroupType.Static}
                      onClick={() => setGroupType(GroupType.Static)}
                    />
                    <BoxWithIconButton
                      title={t("dynamicLabel")}
                      description={t("createADynamicallyPopulatedGroupOfDevices")}
                      icon="code"
                      isActive={groupType === GroupType.Dynamic}
                      onClick={() => setGroupType(GroupType.Dynamic)}
                    />
                  </Stack>
                )}

                {formStep === FormStep.Details && (
                  <Stack direction="row" gap="9" flex="1">
                    <Stack gap="9" w="340px">
                      <Stack gap="5">
                        <Heading as="h4" size="md">
                          {t("information")}
                        </Heading>
                        <FormControl
                          required
                          control={form.control}
                          name="name"
                          label={t("name")}
                          placeholder={t("enterTheGroupName")}
                        />
                        <FormControl
                          required
                          control={form.control}
                          name="folder"
                          label={t("folder")}
                          placeholder={t("eG", { example: t("folderASubfolderB") })}
                          helperText={t("useSlashesToGiveAFolderPath")}
                        />
                        <Separator />
                        <Switch
                          label={t("reports")}
                          description={t("showThisGroupInReports")}
                          control={form.control}
                          name="visibleInReports"
                        />
                      </Stack>
                      {groupType === GroupType.Dynamic && (
                        <>
                          <Separator />
                          <Stack gap="5">
                            <Stack gap="2">
                              <Heading as="h4" size="md">
                                {t("populate")}
                              </Heading>
                              <Text color="grey.400">
                                {t("defineTheSearchCriteriaToDynamicallyPopulateTheGroup")}
                              </Text>
                            </Stack>
                            {driver && (
                              <Tag.Root colorPalette="grey" alignSelf="start">
                                {t("deviceType")} {driver}
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
                                  {t("editQuery")}
                                </Button>
                              )}
                              onSubmit={updateQuery}
                            />
                          </Stack>
                        </>
                      )}
                    </Stack>
                    <Stack flex="1" gap="5" overflow="auto" px="1">
                      <Heading as="h4" size="md">
                        {t(
                          groupType === GroupType.Static
                            ? "selectedDevices"
                            : "deviceListPreview"
                        )}
                      </Heading>
                      {groupType === GroupType.Static && <StaticGroupDeviceList />}
                      {groupType === GroupType.Dynamic && (
                        <DynamicGroupDeviceList
                          driver={driver}
                          query={query}
                          onUpdateQuery={updateQuery}
                        />
                      )}
                    </Stack>
                  </Stack>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Stack direction="row" gap="3">
                  <Button onClick={close}>{t("cancel")}</Button>
                  {formStep === FormStep.Type ? (
                    <Button variant="primary" onClick={next}>
                      {t("next")}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!form.formState.isValid}
                      loading={createMutation.isPending}
                      variant="primary"
                    >
                      {t("create")}
                    </Button>
                  )}
                </Stack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </FormProvider>
  )
}
