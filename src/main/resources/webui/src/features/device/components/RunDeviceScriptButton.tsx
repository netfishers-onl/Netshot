import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { Checkbox, FormControl, Icon, ScheduleForm } from "@/components"
import { ScheduleFormType } from "@/components/ScheduleForm"
import TaskDialog from "@/components/TaskDialog"
import { MUTATIONS, QUERIES } from "@/constants"
import { useCustomDialog, useFormDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Device, Script, SimpleDevice, Task, TaskType } from "@/types"
import {
  Box,
  Center,
  Flex,
  Heading,
  IconButton,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { useForm, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

type RunScriptFormProps = {
  script: Script
  driver: string
  devices: SimpleDevice[] | Device[]
}

function RunScriptForm(props: RunScriptFormProps) {
  const { script, driver, devices } = props

  const { t } = useTranslation()
  const form = useFormContext()

  // Validate script before submitting and retrieve user inputs if exist
  const {
    data: validatedScript,
    isPending,
    isSuccess,
  } = useQuery({
    queryKey: [QUERIES.SCRIPT_VALIDATE, script?.script, driver],
    queryFn: async () =>
      api.script.validate({
        deviceDriver: driver,
        name: "#",
        script: script?.script,
      }),
  })

  useEffect(() => {
    if (isSuccess) {
      // Prepare dynamic form with script user inputs
      const userInputs = {}
      for (const item in validatedScript.userInputDefinitions) {
        userInputs[validatedScript.userInputDefinitions[item].name] = ""
      }
      form.setValue("userInputs", userInputs)
    }
  }, [isSuccess, validatedScript, form])

  // Transform object to array to render the controls
  const inputs = useMemo(() => {
    if (!validatedScript?.userInputDefinitions) {
      return []
    }

    return Object.keys(validatedScript?.userInputDefinitions).map((key) => {
      return validatedScript?.userInputDefinitions[key]
    })
  }, [validatedScript])

  if (isPending) {
    return (
      <Center>
        <Spinner />
      </Center>
    )
  }

  return (
    <Stack gap="8">
      <Stack gap="3">
        <Flex alignItems="center">
          <Box w="140px">
            <Text color="grey.400">{t(devices.length > 1 ? "Devices" : "Device")}</Text>
          </Box>
          <Text>
            {devices.length > 1
              ? devices.map((device) => device.name).join(", ")
              : devices?.[0]?.name}
          </Text>
        </Flex>
        <Flex alignItems="center">
          <Box w="140px">
            <Text color="grey.400">{t("Script")}</Text>
          </Box>
          <Text>{script?.name}</Text>
        </Flex>
      </Stack>
      {inputs.length > 0 && (
        <>
          <Separator />
          <Stack gap="4">
            <Heading as="h5" size="md">
              {t("Parameters")}
            </Heading>
            {inputs?.map((input) => (
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
      <Checkbox control={form.control} name="debugEnabled">
        {t("Enable full trace of the CLI session (only for troubleshooting)")}
      </Checkbox>
      <ScheduleForm />
    </Stack>
  )
}

type Form = {
  userInputs: {
    [k: string]: string
  }
  debugEnabled: boolean
} & ScheduleFormType

type RunScriptButtonProps = {
  devices: SimpleDevice[] | Device[]
  driver: string
  script: Script
}

export default function RunScriptButton(props: RunScriptButtonProps) {
  const { devices, driver, script } = props
  const { t } = useTranslation()
  const toast = useToast()
  const dialog = useFormDialogWithMutation()
  const taskDialog = useCustomDialog()
  const form = useForm<Form>({
    defaultValues: {
      debugEnabled: false,
    },
  })

  const mutation = useMutation({
    mutationKey: MUTATIONS.TASK_CREATE,
    mutationFn: api.task.create,
    onError(err: NetshotError) {
      toast.error({
        title: t("Error"),
        description: err?.description,
      })
    },
  })

  const open = () => {
    const dialogRef = dialog.open(MUTATIONS.TASK_CREATE, {
      title: t("Run script"),
      description: <RunScriptForm devices={devices} script={script} driver={driver} />,
      form,
      async onSubmit(data: Form) {
        const { schedule, userInputs, debugEnabled } = data
        const tasks: Task[] = []

        for (const device of devices) {
          const task = await mutation.mutateAsync({
            type: TaskType.RunDeviceScript,
            device: device?.id,
            driver,
            script: script?.script,
            userInputs,
            debugEnabled,
            ...schedule,
          })

          tasks.push(task)
        }

        dialogRef.close()

        if (tasks.length === 1) {
          taskDialog.open(<TaskDialog id={tasks[0].id} />)
        }
      },
      size: "lg",
      submitButton: {
        label: t("Run"),
      },
    })
  }

  return (
    <IconButton aria-label={t("Run script")} variant="primary" onClick={open}>
      <Icon name="play" />
    </IconButton>
  )
}
