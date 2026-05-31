import { useDeviceTypeOptions } from "@/hooks"
import { Box, Stack } from "@chakra-ui/react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import DeviceTypeSelect from "../DeviceTypeSelect"
import { Select } from "../Select"
import { AttributeForm } from "./AttributeForm"
import { useQueryBuilderAttribute } from "./useQueryBuilderAttribute"

type Props = {
  onInsert(snippet: string): void
}

export function TypeSpecificAttributePanel({ onInsert }: Props) {
  const { t } = useTranslation()
  const deviceTypeOptions = useDeviceTypeOptions()
  const queryBuilderAttribute = useQueryBuilderAttribute()

  const form = useForm<{ deviceType: string | null; attribute: string | null }>({
    defaultValues: { deviceType: null, attribute: null },
  })
  const [deviceType, attrName] = form.watch(["deviceType", "attribute"])

  useEffect(() => {
    if (deviceTypeOptions.options.length > 0 && !form.getValues("deviceType")) {
      form.setValue("deviceType", deviceTypeOptions.options[0].value?.name ?? null)
    }
  }, [deviceTypeOptions.options.length])

  useEffect(() => {
    const attrs = queryBuilderAttribute.getAllTypeSpecificOption(deviceType)
    form.setValue("attribute", attrs[0]?.value.name ?? null)
  }, [deviceType])

  const attributes = queryBuilderAttribute.getAllTypeSpecificOption(deviceType)
  const attribute = attributes.find((a) => a.value.name === attrName)?.value ?? null

  return (
    <Stack gap="3" pt="3">
      <Stack direction="row" gap="3" alignItems="flex-start">
        <Box flex="1">
          <DeviceTypeSelect control={form.control} name="deviceType" label={t("device.type")} />
        </Box>
        {deviceType && (
          <Box flex="1">
            <Select
              control={form.control}
              name="attribute"
              label={t("common.attribute")}
              options={attributes}
              placeholder={t("common.selectDeviceAttribute")}
              itemToValue={(item) => item.value.name}
            />
          </Box>
        )}
      </Stack>
      {attribute && (
        <AttributeForm key={attribute.name} attribute={attribute} onInsert={onInsert} />
      )}
    </Stack>
  )
}
