import ConfigurationCompareEditor from "@/components/ConfigurationCompareEditor"
import DeviceConfigurationSelect from "@/components/DeviceConfigurationSelect"
import { Select } from "@/components/Select"
import { Config, Device, DeviceAttributeDefinition, DeviceType } from "@/types"
import { getConfigDeviceAttributeDefinitions } from "@/utils"
import { Box, Button, Separator, Stack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { LuArrowLeft, LuArrowRight } from "react-icons/lu"
import { useDeviceConfigs } from "../api"

type FormData = {
  current: string
  compare: string
  attribute: DeviceAttributeDefinition["name"]
}

export type DeviceConfigurationCompareViewProps = {
  current: Config
  compare: Config
  device: Device
  type: DeviceType
}

export default function DeviceConfigurationCompareView(props: DeviceConfigurationCompareViewProps) {
  const { current, compare, device, type } = props
  const { t } = useTranslation()
  const { data: configs } = useDeviceConfigs(device.id)

  const attributeDefinitions = type ? getConfigDeviceAttributeDefinitions(type.attributes) : []

  const attributeOptions = attributeDefinitions.map((attr) => ({
    label: attr.name,
    value: attr.name,
  }))

  const defaultValues = useMemo(() => {
    const idx1 = configs.findIndex((c) => c.id === current?.id)
    const idx2 = configs.findIndex((c) => c.id === compare?.id)
    const isOrdered = idx1 > idx2

    return {
      current: (isOrdered ? current : compare)?.id?.toString(),
      compare: (isOrdered ? compare : current)?.id?.toString(),
      attribute: attributeDefinitions[0]?.name ?? null,
    }
  }, [current?.id, compare?.id, configs])

  const form = useForm<FormData>({ defaultValues })

  const selectedCurrent = useWatch({
    control: form.control,
    name: "current",
    compute: (value) => configs.find((c) => c.id === +value),
  })

  const selectedCompare = useWatch({
    control: form.control,
    name: "compare",
    compute: (value) => configs.find((c) => c.id === +value),
  })

  const selectedAttribute = useWatch({
    control: form.control,
    name: "attribute",
    compute: (value) => attributeDefinitions.find((attr) => attr.name === value),
  })

  const [currentValue, compareValue] = form.watch(["current", "compare"])

  const pairIndex = useMemo(() => {
    return Math.min(
      configs.findIndex((c) => c.id === +currentValue),
      configs.findIndex((c) => c.id === +compareValue)
    )
  }, [currentValue, compareValue, configs])

  const isFirst = pairIndex + 1 >= configs.length - 1
  const isLast = pairIndex <= 0

  function navigate(direction: "previous" | "next") {
    if (direction === "previous") {
      if (isFirst) return
      form.setValue("current", configs[pairIndex + 2]?.id?.toString())
      form.setValue("compare", configs[pairIndex + 1]?.id?.toString())
    } else {
      if (isLast) return
      form.setValue("current", configs[pairIndex]?.id?.toString())
      form.setValue("compare", configs[pairIndex - 1]?.id?.toString())
    }
  }

  return (
    <Stack direction="row" gap="7" overflow="auto" flex="1">
      <Stack flex="1" gap="5">
        <Stack gap="4" flex="1">
          <Separator />
          <Stack direction="row">
            <Stack direction="row" flex="1">
              <Button onClick={() => navigate("previous")} disabled={isFirst}>
                <LuArrowLeft />
                {t("Previous")}
              </Button>
              <Box w="280px">
                <DeviceConfigurationSelect
                  control={form.control}
                  name="current"
                  deviceId={device.id}
                />
              </Box>
            </Stack>

            <Stack>
              <Select
                placeholder={t("Select an attribute")}
                control={form.control}
                name="attribute"
                options={attributeOptions}
                width="280px"
              />
            </Stack>

            <Stack direction="row" flex="1" justifyContent="end">
              <Box w="280px">
                <DeviceConfigurationSelect
                  control={form.control}
                  name="compare"
                  deviceId={device.id}
                />
              </Box>
              <Button onClick={() => navigate("next")} disabled={isLast}>
                {t("Next")}
                <LuArrowRight />
              </Button>
            </Stack>
          </Stack>
          <Separator />
          <Stack flex="1">
            {selectedAttribute && (
              <ConfigurationCompareEditor
                current={selectedCurrent}
                compare={selectedCompare}
                attribute={selectedAttribute}
              />
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
