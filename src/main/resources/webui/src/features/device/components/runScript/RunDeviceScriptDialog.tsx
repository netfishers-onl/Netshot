import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import {
  Checkbox,
  DeviceTypeSelect,
  FormControl,
  MonacoEditorControl,
  ScheduleForm,
} from "@/components"
import { ScheduleFormType } from "@/components/ScheduleForm"
import TaskDialog from "@/components/TaskDialog"
import { MUTATIONS, QUERIES } from "@/constants"
import { useCustomDialog, useDialogConfig } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, Script, ScriptUserInputDefinition, SimpleDevice, Task, TaskType } from "@/types"
import {
  Badge,
  Box,
  Button,
  Center,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  Portal,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form"
import { LuMinimize2, LuPencil, LuPlus, LuSave } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { NEW_SCRIPT_TEMPLATE } from "./constants"
import LoadScriptButton from "./LoadScriptButton"
import SaveScriptDialog from "./SaveScriptDialog"

enum FormStep {
  Configure,
  Run,
}

type ScriptMeta = {
  id: number
  name: string
  folder: string
}

type RunDeviceScriptForm = {
  driver: string | null
  script: string
  userInputs: Record<string, string>
  debugEnabled: boolean
  runSnapshot: boolean
} & ScheduleFormType

type ConfigureStepProps = {
  isExpanded: boolean
  scriptMeta: ScriptMeta | null
  isNewScript: boolean
  isDirty: boolean
  onLoad(script: Script): void
  onWriteNew(): void
  onEdit(): void
  onSave(): void
}

function ConfigureStep(props: ConfigureStepProps) {
  const { isExpanded, scriptMeta, isNewScript, isDirty, onLoad, onWriteNew, onEdit, onSave } = props
  const { t } = useTranslation()
  const form = useFormContext<RunDeviceScriptForm>()

  const leftColumn = (
    <Stack
      gap="6"
      w={isExpanded ? "280px" : "full"}
      flexShrink={0}
      h={isExpanded ? "full" : undefined}
      p="3"
      pe={isExpanded ? "4" : "3"}
    >
      <DeviceTypeSelect
        required
        control={form.control}
        name="driver"
        label={t("admin.driver.label")}
      />
      {scriptMeta ? (
        <Stack gap="3">
          <Stack gap="1">
            <Text fontSize="sm" color="grey.400">
              {t("script.label")}
            </Text>
            <Stack direction="row" alignItems="center" gap="2">
              <Text fontWeight="semibold">{scriptMeta.name}</Text>
              {isDirty && (
                <Badge size="sm" colorPalette="orange" variant="subtle">
                  {t("script.modified")}
                </Badge>
              )}
            </Stack>
          </Stack>
          <Stack direction="row" gap="2" flexWrap="wrap">
            {!isExpanded && (
              <Button size="sm" onClick={onEdit}>
                <LuPencil />
                {t("common.edit")}
              </Button>
            )}
            {(isExpanded || isDirty) && (
              <Button size="sm" onClick={onSave}>
                <LuSave />
                {t("common.save")}
              </Button>
            )}
          </Stack>
        </Stack>
      ) : isNewScript ? (
        <Stack gap="3">
          <Text fontSize="sm" color="grey.400">
            {t("script.newScript")}
          </Text>
          <Stack direction="row" gap="2" flexWrap="wrap">
            {!isExpanded && (
              <Button size="sm" onClick={onEdit}>
                <LuPencil />
                {t("common.edit")}
              </Button>
            )}
            <Button size="sm" onClick={onSave}>
              <LuSave />
              {t("common.save")}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack gap="3">
          <LoadScriptButton onLoad={onLoad} />
          <Stack direction="row" alignItems="center" gap="3">
            <Separator flex="1" />
            <Text color="grey.400" fontSize="sm">
              {t("common.or")}
            </Text>
            <Separator flex="1" />
          </Stack>
          <Button onClick={onWriteNew}>
            <LuPlus />
            {t("script.writeNew")}
          </Button>
        </Stack>
      )}
    </Stack>
  )

  if (!isExpanded) {
    return (
      <Stack gap="6" flex="1">
        {leftColumn}
      </Stack>
    )
  }

  return (
    <Stack direction="row" gap="7" overflow="auto" flex="1">
      {leftColumn}
      <Stack flex="1" overflow="auto">
        <MonacoEditorControl required control={form.control} name="script" language="typescript" />
      </Stack>
    </Stack>
  )
}

type RunStepProps = {
  devices: SimpleDevice[] | Device[]
  inputs: ScriptUserInputDefinition[]
  isPending: boolean
}

function RunStep(props: RunStepProps) {
  const { devices, inputs, isPending } = props
  const { t } = useTranslation()
  const form = useFormContext<RunDeviceScriptForm>()

  if (isPending) {
    return (
      <Center flex="1">
        <Spinner />
      </Center>
    )
  }

  return (
    <Stack gap="6" flex="1">
      <Stack gap="3">
        {devices.length > 1 ? (
          <Flex>
            <Box w="140px">
              <Text color="grey.400">{t("device.devices")}</Text>
            </Box>
            <Text>{devices.map((device) => device.name).join(", ")}</Text>
          </Flex>
        ) : (
          <>
            <Flex alignItems="center">
              <Box w="140px">
                <Text color="grey.400">{t("common.name")}</Text>
              </Box>
              <Text>{devices?.[0]?.name ?? "nA"}</Text>
            </Flex>
            <Flex alignItems="center">
              <Box w="140px">
                <Text color="grey.400">{t("device.interface.ipAddress")}</Text>
              </Box>
              <Text>{devices?.[0]?.mgmtAddress ?? "nA"}</Text>
            </Flex>
          </>
        )}
      </Stack>
      {inputs.length > 0 && (
        <>
          <Separator />
          <Stack gap="4">
            <Heading as="h5" size="md">
              {t("script.parameters")}
            </Heading>
            {inputs.map((input) => (
              <FormControl
                key={input.name}
                label={input.label}
                placeholder={input.description}
                control={form.control}
                name={`userInputs.${input.name}`}
              />
            ))}
          </Stack>
          <Separator />
        </>
      )}
      <Stack gap="3">
        <Checkbox control={form.control} name="runSnapshot">
          {t("device.runSnapshotAfterScript")}
        </Checkbox>
        <Checkbox control={form.control} name="debugEnabled">
          {t("device.enableFullTrace")}
        </Checkbox>
      </Stack>
      <ScheduleForm />
    </Stack>
  )
}

export type RunDeviceScriptDialogProps = {
  devices: SimpleDevice[] | Device[]
}

export default function RunDeviceScriptDialog(props: RunDeviceScriptDialogProps) {
  const { devices } = props
  const { t } = useTranslation()
  const toast = useToast()
  const dialogConfig = useDialogConfig()
  const customDialog = useCustomDialog()

  const [formStep, setFormStep] = useState(FormStep.Configure)
  const [isExpanded, setIsExpanded] = useState(false)
  const [scriptMeta, setScriptMeta] = useState<ScriptMeta | null>(null)
  const [isNewScript, setIsNewScript] = useState(false)
  const [originalContent, setOriginalContent] = useState("")

  const form = useForm<RunDeviceScriptForm>({
    mode: "onChange",
    defaultValues: {
      driver: devices?.[0]?.driver ?? null,
      script: "",
      userInputs: {},
      debugEnabled: false,
      runSnapshot: true,
    },
  })

  const scriptValue = useWatch({ control: form.control, name: "script" })
  const driverValue = useWatch({ control: form.control, name: "driver" })
  const isDirty = scriptMeta != null && scriptValue !== originalContent
  const canProceedToRun = Boolean(driverValue) && Boolean(scriptValue?.trim())

  function applyConfigureSize(expanded: boolean) {
    dialogConfig.update({
      variant: expanded ? "full-floating" : undefined,
      size: expanded ? "lg" : "md",
    })
  }

  function expand() {
    setIsExpanded(true)
    applyConfigureSize(true)
  }

  function collapse() {
    setIsExpanded(false)
    applyConfigureSize(false)
  }

  function loadScript(script: Script) {
    form.setValue("script", script.script, { shouldValidate: true })
    form.setValue("driver", script.deviceDriver, { shouldValidate: true })
    setScriptMeta({ id: script.id, name: script.name, folder: script.folder })
    setIsNewScript(false)
    setOriginalContent(script.script)
  }

  function writeNewScript() {
    form.setValue("script", NEW_SCRIPT_TEMPLATE, { shouldValidate: true })
    setScriptMeta(null)
    setIsNewScript(true)
    setOriginalContent(NEW_SCRIPT_TEMPLATE)
    expand()
  }

  function openSaveDialog() {
    const values = form.getValues()

    customDialog.open(
      <SaveScriptDialog
        initialName={scriptMeta?.name ?? ""}
        initialFolder={scriptMeta?.folder ?? ""}
        driver={values.driver!}
        scriptContent={values.script}
        onSaved={(saved) => {
          setScriptMeta({ id: saved.id, name: saved.name, folder: saved.folder })
          setIsNewScript(false)
          setOriginalContent(values.script)
          toast.success({
            title: t("common.success"),
            description: t("script.savedForLaterUse"),
          })
        }}
      />,
      { size: "lg" }
    )
  }

  function next() {
    setFormStep(FormStep.Run)
    dialogConfig.update({ variant: undefined, size: "lg" })
  }

  function previous() {
    setFormStep(FormStep.Configure)
    applyConfigureSize(isExpanded)
  }

  function close() {
    dialogConfig.close()
  }

  const validateEnabled = formStep === FormStep.Run && Boolean(driverValue) && Boolean(scriptValue)

  const {
    data: validatedScript,
    isPending: isValidatePending,
    isSuccess: isValidateSuccess,
  } = useQuery({
    queryKey: [QUERIES.SCRIPT_VALIDATE, scriptValue, driverValue],
    queryFn: async () =>
      api.script.validate({
        deviceDriver: driverValue!,
        name: "#",
        script: scriptValue,
      }),
    enabled: validateEnabled,
  })

  useEffect(() => {
    if (isValidateSuccess) {
      const userInputs: Record<string, string> = {}
      for (const key in validatedScript!.userInputDefinitions) {
        userInputs[validatedScript!.userInputDefinitions[key].name] = ""
      }
      form.setValue("userInputs", userInputs)
    }
  }, [isValidateSuccess, validatedScript, form])

  const inputs = useMemo(() => {
    if (!validatedScript?.userInputDefinitions) return []
    return Object.keys(validatedScript.userInputDefinitions).map(
      (key) => validatedScript.userInputDefinitions[key]
    )
  }, [validatedScript])

  const runMutation = useMutation({
    mutationKey: MUTATIONS.TASK_CREATE,
    mutationFn: api.task.create,
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  async function submit(values: RunDeviceScriptForm) {
    const { schedule, userInputs, debugEnabled, runSnapshot, driver, script } = values
    const tasks: Task[] = []

    for (const device of devices) {
      const task = await runMutation.mutateAsync({
        type: TaskType.RunDeviceScript,
        device: device?.id,
        driver: driver!,
        script,
        userInputs,
        debugEnabled,
        runSnapshot,
        ...schedule,
      })

      tasks.push(task!)
    }

    close()

    if (tasks.length === 1) {
      customDialog.open(<TaskDialog id={tasks[0].id} />)
    }
  }

  const title = t("script.run")

  return (
    <FormProvider {...form}>
      <Dialog.Root
        open={dialogConfig.props.isOpen}
        placement="center"
        motionPreset="slide-in-bottom"
        size={dialogConfig.props.size}
        variant={dialogConfig.props.variant}
        closeOnInteractOutside={false}
        scrollBehavior="inside"
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
              <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
                <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                  {title}
                </Heading>

                <Stack direction="row" gap="3" alignItems="center">
                  {formStep === FormStep.Configure && isExpanded && (
                    <Button size="sm" variant="ghost" onClick={collapse}>
                      <LuMinimize2 />
                      {t("script.exitEditMode")}
                    </Button>
                  )}
                  <Text fontSize="md" color="grey.400">
                    {t("common.stepXofY", { step: formStep === FormStep.Configure ? 1 : 2, total: 2 })}
                  </Text>
                  <CloseButton size="sm" variant="outline" onClick={close} />
                </Stack>
              </Dialog.Header>
              <Dialog.Body flex="1" display="flex" overflow={formStep === FormStep.Run ? "auto" : undefined}>
                {formStep === FormStep.Configure ? (
                  <ConfigureStep
                    isExpanded={isExpanded}
                    scriptMeta={scriptMeta}
                    isNewScript={isNewScript}
                    isDirty={isDirty}
                    onLoad={loadScript}
                    onWriteNew={writeNewScript}
                    onEdit={expand}
                    onSave={openSaveDialog}
                  />
                ) : (
                  <RunStep devices={devices} inputs={inputs} isPending={isValidatePending} />
                )}
              </Dialog.Body>
              <Dialog.Footer justifyContent="flex-end">
                <Stack direction="row" gap="3" alignItems="center">
                  <Button onClick={close}>{t("common.cancel")}</Button>
                  <Button onClick={previous} disabled={formStep === FormStep.Configure}>
                    {t("common.previous")}
                  </Button>
                  {formStep === FormStep.Configure && (
                    <Button disabled={!canProceedToRun} onClick={next}>
                      {t("common.next")}
                    </Button>
                  )}
                  {formStep === FormStep.Run && (
                    <Button
                      type="submit"
                      variant="primary"
                      loading={runMutation.isPending}
                      disabled={!form.formState.isValid}
                    >
                      {t("common.run")}
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
