import { ConfigCompareView } from "@/components"
import { Config, Device, DeviceType } from "@/types"
import { getConfigDeviceAttributeDefinitions } from "@/utils"
import { Button, Separator, Stack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useDeviceConfigs } from "../api"
import { LuArrowLeft, LuArrowRight } from "react-icons/lu"

type FormData = {
  current: string
  compare: string
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
  const { data: configs } = useDeviceConfigs(device?.id)

  const attributeDefinitions = type ? getConfigDeviceAttributeDefinitions(type.attributes) : []

  const defaultValues = useMemo(() => {
    const idx1 = configs?.findIndex((c) => c.id === current?.id) ?? -1
    const idx2 = configs?.findIndex((c) => c.id === compare?.id) ?? -1
    const isOrdered = idx1 > idx2

    return {
      current: (isOrdered ? current : compare)?.id?.toString(),
      compare: (isOrdered ? compare : current)?.id?.toString(),
    }
  }, [current?.id, compare?.id, configs])

  const form = useForm<FormData>({ defaultValues })

  const selectedCurrent = useWatch({
    control: form.control,
    name: "current",
    compute: (value) => configs?.find((c) => c.id === +value),
  })

  const selectedCompare = useWatch({
    control: form.control,
    name: "compare",
    compute: (value) => configs?.find((c) => c.id === +value),
  })

  const [currentValue, compareValue] = form.watch(["current", "compare"])

  const currentIndex = useMemo(
    () => configs?.findIndex((c) => c.id === +currentValue) ?? -1,
    [currentValue, configs]
  )
  const compareIndex = useMemo(
    () => configs?.findIndex((c) => c.id === +compareValue) ?? -1,
    [compareValue, configs]
  )

  const isConsecutive =
    currentIndex !== -1 && compareIndex !== -1 && Math.abs(currentIndex - compareIndex) === 1

  const pairIndex = Math.min(currentIndex, compareIndex)

  const isFirst = pairIndex + 1 >= (configs?.length ?? 0) - 1
  const isLast = pairIndex <= 0

  function navigate(direction: "previous" | "next") {
    if (!configs) return
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
      <Stack flex="1" gap="4">
        <Separator />
        <ConfigCompareView
          current={selectedCurrent}
          compare={selectedCompare}
          attributeDefinitions={attributeDefinitions}
          leftExtra={
            isConsecutive && (
              <Button onClick={() => navigate("previous")} disabled={isFirst}>
                <LuArrowLeft />
                {t("common.previous")}
              </Button>
            )
          }
          rightExtra={
            isConsecutive && (
              <Button onClick={() => navigate("next")} disabled={isLast}>
                {t("common.next")}
                <LuArrowRight />
              </Button>
            )
          }
        />
      </Stack>
    </Stack>
  )
}
