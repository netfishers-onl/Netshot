import api from "@/api"
import { DeviceTypeSelect, Icon, MonacoEditor } from "@/components"
import { QUERIES } from "@/constants"
import { useDeviceTypeOptions, useToast } from "@/hooks"
import { Device, DeviceType, SimpleDevice } from "@/types"
import { Button, Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import RunDeviceScriptButton from "./RunDeviceScriptButton"

type ScriptEditorForm = {
  script: string
  driver: DeviceType["name"]
}

export type DeviceScriptEditorProps = {
  devices: SimpleDevice[] | Device[]
  scriptId: number
}

export default function DeviceScriptEditor(props: DeviceScriptEditorProps) {
  const { devices, scriptId } = props
  const { t } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const form = useForm<ScriptEditorForm>({
    defaultValues: {
      script: "",
      driver: null,
    },
  })

  const {
    data: script,
    isPending,
    isSuccess,
  } = useQuery({
    queryKey: [QUERIES.SCRIPT_DETAIL, scriptId],
    queryFn: async () => api.script.getById(scriptId),
  })

  useEffect(() => {
    if (isSuccess) {
      form.setValue("script", script.script)
    }
  }, [isSuccess, script])

  const { isLoading: isDeviceTypeOptionsLoading } = useDeviceTypeOptions()

  const driver = useWatch({
    control: form.control,
    name: "driver",
  })

  const scriptValue = useWatch({
    control: form.control,
    name: "script",
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues()

      await api.script.remove(scriptId)
      await api.script.create({
        name: script.name,
        deviceDriver: driver,
        script: values.script,
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.SCRIPT_LIST] })
      toast.success({
        title: t("Success"),
        description: t("Script successfully saved for later usage"),
      })
    },
    onError() {
      toast.error({
        title: t("Error"),
        description: "An error occurred during the save",
      })
    },
  })

  const save = useCallback(() => {
    saveMutation.mutate()
  }, [saveMutation])

  // Set default driver from device
  useEffect(() => {
    if (isDeviceTypeOptionsLoading || isPending) {
      return
    }

    form.setValue("driver", script?.deviceDriver)
  }, [isDeviceTypeOptionsLoading, isPending, script])

  const onChange = useCallback(
    (value: string) => {
      form.setValue("script", value)
    },
    [form]
  )

  if (isPending) {
    return (
      <Center flex="1">
        <Stack alignItems="center" gap="3">
          <Spinner />
          <Text>{t("Loading script")}</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack flex="1" gap="4">
      <Stack direction="row">
        <DeviceTypeSelect
          control={form.control}
          name="driver"
          css={{
            flex: 1,
          }}
        />
        <Button onClick={save}>
          <Icon name="database" />
          {t("Save")}
        </Button>
        <RunDeviceScriptButton
          devices={devices}
          driver={driver}
          script={{
            ...script,
            script: scriptValue,
          }}
        />
      </Stack>
      <MonacoEditor value={script?.script} language="typescript" onModelChange={onChange} />
    </Stack>
  )
}
