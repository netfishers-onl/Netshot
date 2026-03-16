import api, { CreateOrUpdateTaskPayload } from "@/api"
import { Checkbox, DomainSelect, FormControl, Icon, Switch, TreeGroupSelector } from "@/components"
import { FormControlType } from "@/components/FormControl"
import ScheduleForm, { ScheduleFormType } from "@/components/ScheduleForm"
import TaskDialog from "@/components/TaskDialog"
import { useCustomDialog, useDialogConfig } from "@/dialog"
import { useToast } from "@/hooks"
import { TaskType } from "@/types"
import {
  Button,
  Dialog,
  Heading,
  IconButton,
  Portal,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import TaskBoxButton from "./TaskBoxButton"

enum FormStep {
  Type,
  Details,
}

type FormData = {
  checkCompliance: boolean
  runDiagnostic: boolean
  group: number
  limitToOutofdateDevice: boolean
  limitToOutofdateDeviceHours?: number
  domain?: string
  subnets: string[]
  configDaysToPurge?: number
  hasConfigDaysToPurge?: boolean
  configKeepDays?: number
  hasConfigKeepDays?: boolean
  configSizeToPurge?: number
  hasConfigSizeToPurge?: boolean
  hasModuleDaysToPurge?: boolean
  moduleDaysToPurge?: number
  daysToPurge?: number
} & ScheduleFormType

export default function AddTaskDialog() {
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const taskDialog = useCustomDialog()
  const dialogConfig = useDialogConfig()
  const [taskType, setTaskType] = useState<TaskType>(null)
  const [formStep, setFormStep] = useState(FormStep.Type)

  const form = useForm<FormData>({
    defaultValues: {
      subnets: [""] as string[],
      limitToOutofdateDeviceHours: 0,
      checkCompliance: false,
      runDiagnostic: false,
      group: null,
      domain: null,
      daysToPurge: 90,
      configDaysToPurge: 200,
      configSizeToPurge: 500,
      configKeepDays: 7,
      hasConfigDaysToPurge: false,
      hasConfigKeepDays: false,
      hasConfigSizeToPurge: false,
      hasModuleDaysToPurge: false,
      moduleDaysToPurge: 600,
    },
  })

  const hasConfigDaysToPurge = useWatch({
    control: form.control,
    name: "hasConfigDaysToPurge",
  })

  const hasConfigKeepDays = useWatch({
    control: form.control,
    name: "hasConfigKeepDays",
  })

  const hasConfigSizeToPurge = useWatch({
    control: form.control,
    name: "hasConfigSizeToPurge",
  })

  const hasModuleDaysToPurge = useWatch({
    control: form.control,
    name: "hasModuleDaysToPurge",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    // @ts-expect-error: useFieldArray takes an array of object instead of string
    name: "subnets",
  })

  const createMutation = useMutation({
    mutationFn: api.task.create,
    onSuccess(newTask) {
      close()

      taskDialog.open(<TaskDialog id={newTask.id} />)

      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_ALL] })
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_CANCELLED] })
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_FAILED] })
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_RUNNING] })
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_SCHEDULED] })
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_SUCCEEDED] })
    },
    onError() {
      toast.error({
        title: t("Error"),
        description: t("An error occurred during the task creation"),
      })
    },
  })

  const hasGroup =
    taskType === TaskType.TakeGroupSnapshot ||
    taskType === TaskType.RunGroupDiagnostic ||
    taskType === TaskType.CheckGroupCompliance ||
    taskType === TaskType.CheckGroupSoftware

  const submit = (values: FormData) => {
    const { schedule } = values

    const payload: CreateOrUpdateTaskPayload = {
      type: taskType,
      ...schedule,
    }

    if (taskType === TaskType.TakeGroupSnapshot) {
      payload.dontRunDiagnostics = !values.runDiagnostic

      if (values.limitToOutofdateDevice) {
        payload.limitToOutofdateDeviceHours = values.limitToOutofdateDeviceHours
      }
    }

    if (taskType === TaskType.TakeGroupSnapshot || taskType === TaskType.RunGroupDiagnostic) {
      payload.dontCheckCompliance = !values.checkCompliance
    }

    if (hasGroup) {
      payload.group = values.group
    }

    if (taskType === TaskType.ScanSubnets) {
      payload.domain = +values.domain
      payload.subnets = values.subnets.join("\n")
    }

    if (taskType === TaskType.PurgeDatabase) {
      payload.daysToPurge = values.daysToPurge

      if (hasConfigDaysToPurge) {
        payload.configDaysToPurge = values.configDaysToPurge
      }

      payload.configSizeToPurge = hasConfigSizeToPurge ? values.configSizeToPurge : 0
      payload.configKeepDays = hasConfigKeepDays ? values.configKeepDays : 0
      payload.group = values.group

      if (values.hasModuleDaysToPurge) {
        payload.moduleDaysToPurge = values.moduleDaysToPurge
      }
    }

    createMutation.mutate(payload)
  }

  const next = () => {
    setFormStep(FormStep.Details)
  }

  const previous = () => {
    setTaskType(null)
    setFormStep(FormStep.Type)
  }

  const close = () => {
    dialogConfig.close()
    setTimeout(() => {
      setTaskType(null)
      setFormStep(FormStep.Type)
    })
  }

  const taskTypeOptions = useMemo(
    () => [
      {
        icon: "camera",
        type: TaskType.TakeGroupSnapshot,
        label: t("Snapshot"),
        description: t("Take a snapshot of a group of devices"),
      },
      {
        icon: "play",
        type: TaskType.RunGroupDiagnostic,
        label: t("Diagnostic"),
        description: t("Run diagnostics on a group of devices"),
      },
      {
        icon: "check",
        type: TaskType.CheckGroupCompliance,
        label: t("Configuration compliance"),
        description: t("Check the configuration compliance of a group of devices"),
      },
      {
        icon: "server",
        type: TaskType.CheckGroupSoftware,
        label: t("Software & hardware compliance"),
        description: t(
          "Check the software compliance and hardware support status of a group of devices"
        ),
      },
      {
        icon: "search",
        type: TaskType.ScanSubnets,
        label: t("Discover devices"),
        description: t("Scan subnets to discover devices"),
      },
      {
        icon: "database",
        type: TaskType.PurgeDatabase,
        label: t("Purge database"),
        description: t("Purge old entries from the database"),
      },
    ],
    [t]
  )

  const taskInfoBox = useMemo(() => {
    const selectedType = taskTypeOptions.find((opt) => opt.type === taskType)

    return (
      <Stack gap="0" borderRadius="2xl" bg="green.50" p="6">
        <Text color="green.800" fontWeight="semibold">
          {selectedType?.label}
        </Text>
        <Text color="green.800">{selectedType?.description}</Text>
      </Stack>
    )
  }, [t, taskType, taskTypeOptions])

  const limitToOutofdateDevice = useWatch({
    control: form.control,
    name: "limitToOutofdateDevice",
  })

  const group = useWatch({
    control: form.control,
    name: "group",
  })

  useEffect(() => {
    form.reset()
  }, [taskType, form])

  useEffect(() => {
    form.setValue("hasConfigKeepDays", hasConfigDaysToPurge)
    form.setValue("hasConfigSizeToPurge", hasConfigDaysToPurge)
  }, [hasConfigDaysToPurge])

  return (
    <FormProvider {...form}>
      <Dialog.Root
        preventScroll={false}
        placement="center"
        open={dialogConfig.props.isOpen}
        scrollBehavior="inside"
        size="md"
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
            <Dialog.Content as="form" onSubmit={form.handleSubmit(submit)}>
              <Dialog.Header display="flex" justifyContent="space-between">
                <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                  {t("Add task")}
                </Heading>

                <Text fontSize="md" color="grey.400">
                  {t(formStep === FormStep.Type ? "Step 1/2" : "Step 2/2")}
                </Text>
              </Dialog.Header>
              <Dialog.Body>
                {formStep === FormStep.Type ? (
                  <Stack gap="3">
                    {taskTypeOptions.map((option) => (
                      <TaskBoxButton
                        icon={option.icon}
                        label={option.label}
                        description={option.description}
                        isActive={option.type === taskType}
                        onClick={() => setTaskType(option.type)}
                        key={option.label}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Stack gap="6">
                    {taskInfoBox}

                    {hasGroup && (
                      <TreeGroupSelector
                        label={t("Group to process")}
                        value={group ? [group] : []}
                        onChange={(groups) => form.setValue("group", groups?.[0])}
                      />
                    )}

                    {taskType === TaskType.TakeGroupSnapshot && (
                      <>
                        <Checkbox control={form.control} name="limitToOutofdateDevice">
                          {t("Limit to devices unchanged for")}
                        </Checkbox>

                        <FormControl
                          control={form.control}
                          name="limitToOutofdateDeviceHours"
                          type={FormControlType.Number}
                          disabled={!limitToOutofdateDevice}
                          required={limitToOutofdateDevice}
                        />
                        <Checkbox control={form.control} name="runDiagnostic">
                          {t("Run the device diagnostics after snapshot")}
                        </Checkbox>
                      </>
                    )}

                    {[TaskType.TakeGroupSnapshot, TaskType.RunGroupDiagnostic].includes(
                      taskType
                    ) && (
                      <Checkbox control={form.control} name="checkCompliance">
                        {t("Check device compliance after the snapshot")}
                      </Checkbox>
                    )}

                    {taskType === TaskType.ScanSubnets && (
                      <>
                        <DomainSelect required control={form.control} name="domain" />
                        <Stack gap="6">
                          <Heading as="h5" size="sm">
                            {t("Subnets or IP addresses")}
                          </Heading>
                          {fields.length > 0 && (
                            <Stack gap="3">
                              {fields.map((field, index) => (
                                <Stack direction="row" gap="4" key={field.id}>
                                  <FormControl
                                    required
                                    control={form.control}
                                    name={`subnets.${index}`}
                                    placeholder={t("Enter an IP address (e.g. 10.100.2.8)")}
                                    rules={{
                                      pattern: {
                                        value:
                                          /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
                                        message: t("This is not a valid IP address"),
                                      },
                                    }}
                                  />
                                  {fields.length > 1 && (
                                    <IconButton
                                      onClick={() => remove(index)}
                                      variant="ghost"
                                      colorPalette="green"
                                      aria-label={t("Remove this subnet")}
                                    >
                                      <Icon name="trash" />
                                    </IconButton>
                                  )}
                                </Stack>
                              ))}
                            </Stack>
                          )}
                          <Stack direction="row">
                            <Button onClick={() => append("")}>
                              <Icon name="plus" />
                              {t("Add entry")}
                            </Button>
                          </Stack>
                        </Stack>
                      </>
                    )}

                    {taskType === TaskType.PurgeDatabase && (
                      <Stack gap="5">
                        <Stack gap="3">
                          <Stack gap="0">
                            <Text fontWeight="medium">{t("Purge tasks")}</Text>
                            <Text color="grey.400">{t("Purge tasks finished more than")}</Text>
                          </Stack>
                          <FormControl
                            control={form.control}
                            name="daysToPurge"
                            type={FormControlType.Number}
                            suffix={
                              <Text color="grey.400" pr="5">
                                {t("Days")}
                              </Text>
                            }
                          />
                        </Stack>
                        <Separator />
                        <Stack gap="3">
                          <Stack direction="row" gap="6">
                            <Stack gap="0" flex="1">
                              <Text fontWeight="medium">{t("Purge configuration")}</Text>
                              <Text color="grey.400">
                                {t("Delete old configurations prior to")}
                              </Text>
                            </Stack>
                            <Switch
                              w="initial"
                              control={form.control}
                              name="hasConfigDaysToPurge"
                            />
                          </Stack>
                          <FormControl
                            disabled={!hasConfigDaysToPurge}
                            control={form.control}
                            name="configDaysToPurge"
                            type={FormControlType.Number}
                            suffix={
                              <Text color="grey.400" pr="5">
                                {t("Days")}
                              </Text>
                            }
                          />
                        </Stack>
                        <Stack gap="3">
                          <Stack direction="row" gap="6">
                            <Stack gap="0" flex="1">
                              <Text fontWeight="medium">{t("Configuration size")}</Text>
                              <Text color="grey.400">{t("Only configurations bigger than")}</Text>
                            </Stack>
                            <Switch
                              w="initial"
                              control={form.control}
                              name="hasConfigSizeToPurge"
                            />
                          </Stack>
                          <FormControl
                            disabled={!hasConfigSizeToPurge}
                            control={form.control}
                            name="configSizeToPurge"
                            type={FormControlType.Number}
                            suffix={
                              <Text color="grey.400" pr="5">
                                {t("KB")}
                              </Text>
                            }
                          />
                        </Stack>
                        <Stack gap="3">
                          <Stack direction="row" gap="6">
                            <Stack gap="0" flex="1">
                              <Text fontWeight="medium">{t("Keep configuration")}</Text>
                              <Text color="grey.400">
                                {t("Keep for each device one config every")}
                              </Text>
                            </Stack>
                            <Switch w="initial" control={form.control} name="hasConfigKeepDays" />
                          </Stack>
                          <FormControl
                            disabled={!hasConfigKeepDays}
                            control={form.control}
                            name="configKeepDays"
                            type={FormControlType.Number}
                            suffix={
                              <Text color="grey.400" pr="5">
                                {t("Days")}
                              </Text>
                            }
                          />
                        </Stack>
                        <Stack gap="3">
                          <Stack direction="row" gap="6">
                            <Stack gap="0" flex="1">
                              <Text fontWeight="medium">{t("Delete modules")}</Text>
                              <Text color="grey.400">{t("Delete modules removed more than")}</Text>
                            </Stack>
                            <Switch
                              w="initial"
                              control={form.control}
                              name="hasModuleDaysToPurge"
                            />
                          </Stack>
                          <FormControl
                            disabled={!hasModuleDaysToPurge}
                            control={form.control}
                            name="moduleDaysToPurge"
                            type={FormControlType.Number}
                            suffix={
                              <Text color="grey.400" pr="5">
                                {t("Days ago")}
                              </Text>
                            }
                          />
                        </Stack>
                        <Separator />
                        <TreeGroupSelector
                          label={t("Limit to")}
                          value={group ? [group] : []}
                          onChange={(groups) => form.setValue("group", groups?.[0])}
                        />
                        <Separator />
                      </Stack>
                    )}
                    <ScheduleForm />
                  </Stack>
                )}
              </Dialog.Body>
              <Dialog.Footer justifyContent="space-between">
                {formStep === FormStep.Details && (
                  <Button onClick={previous}>{t("Previous")}</Button>
                )}
                <Stack direction="row" gap="3" flex="1" justifyContent="end">
                  <Button onClick={close}>{t("Cancel")}</Button>
                  {formStep === FormStep.Type && (
                    <Button variant="primary" disabled={taskType === null} onClick={next}>
                      {t("Next")}
                    </Button>
                  )}

                  {formStep === FormStep.Details && (
                    <Button
                      type="submit"
                      disabled={!form.formState.isValid}
                      loading={createMutation.isPending}
                      variant="primary"
                    >
                      {t("Create")}
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
