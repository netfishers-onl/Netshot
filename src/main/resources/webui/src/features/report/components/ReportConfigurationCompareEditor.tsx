import api from "@/api"
import { ConfigCompareEditor } from "@/components"
import { Select } from "@/components/Select"
import { useDevice, useDeviceTypes } from "@/features/device/api"
import { DeviceAttributeDefinition, LightConfig } from "@/types"
import { getConfigDeviceAttributeDefinitions } from "@/utils"
import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

type FormData = {
  attribute: DeviceAttributeDefinition["name"]
}

export type ReportConfigurationCompareEditorProps = {
  config: LightConfig
}

export default function ReportConfigurationCompareEditor(
  props: ReportConfigurationCompareEditorProps
) {
  const { config } = props
  const { t } = useTranslation()

  const form = useForm<FormData>()

  const { data: deviceTypes, isPending: isDeviceTypeLoading } = useDeviceTypes()
  const { data: device, isPending: isDeviceLoading } = useDevice(config.deviceId)

  const { data: currentConfig, isPending: isCurrentConfigLoading } = useQuery({
    queryKey: [QUERIES.DEVICE_CURRENT_CONFIG, config.deviceId],
    queryFn: () => api.device.getPreviousConfig(config.deviceId, config.id),
  })

  const { data: compareConfig, isPending: isCompareConfigLoading } = useQuery({
    queryKey: [QUERIES.DEVICE_CONFIG, config.deviceId, config.id],
    queryFn: () => api.device.getConfigById(config.deviceId, config.id),
  })

  const isLoading =
    isCompareConfigLoading || isCurrentConfigLoading || isDeviceTypeLoading || isDeviceLoading
  const deviceType = deviceTypes?.find((t) => t.name === device?.driver)

  const attributeDefinitions = deviceType
    ? getConfigDeviceAttributeDefinitions(deviceType.attributes)
    : []

  const attributeOptions = attributeDefinitions.map((attr) => ({
    label: attr.name,
    value: attr.name,
  }))

  const selectedAttribute = useWatch({
    control: form.control,
    name: "attribute",
    compute: (value) => attributeDefinitions.find((attr) => attr.name === value),
  })

  if (isLoading) {
    return (
      <Center flex="1">
        <Stack gap="3" alignItems="center">
          <Spinner size="lg" />
          <Text>{t("loadingDeviceConfiguration")}</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="6">
      <Select
        placeholder={t("selectAnAttribute")}
        control={form.control}
        name="attribute"
        options={attributeOptions}
      />
      <ConfigCompareEditor
        attribute={selectedAttribute}
        current={currentConfig}
        compare={compareConfig}
      />
    </Stack>
  )
}
