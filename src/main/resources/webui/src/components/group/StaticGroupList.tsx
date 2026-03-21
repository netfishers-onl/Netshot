import { DeviceAutocomplete, Icon } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { SimpleDevice } from "@/types"
import { Center, Heading, IconButton, Stack, Text } from "@chakra-ui/react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import GroupDeviceBox from "./GroupDeviceBox"
import { AddGroupForm } from "./types"

export default function StaticGroupList() {
  const { t } = useTranslation()
  const form = useFormContext<AddGroupForm>()

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "staticDevices",
    keyName: "uid",
  })

  const removeDevice = (index: number) => {
    remove(index)
  }

  const excludeSelected = (options: SimpleDevice[]): SimpleDevice[] => {
    const selectedIds: number[] = fields.map((f) => f.id)
    return options.filter((o) => !selectedIds.includes(o.id))
  }

  return (
    <>
      <DeviceAutocomplete onSelectItem={append} filterBy={excludeSelected} />
      <Stack flex="1" overflowY="auto">
        {fields.length > 0 ? (
          <>
            {fields.map((device, index) => (
              <GroupDeviceBox device={device} key={device?.id}>
                <Tooltip content={t("removeDevice")}>
                  <IconButton
                    aria-label={t("removeDevice")}
                    position="absolute"
                    top="2"
                    right="2"
                    variant="ghost"
                    colorPalette="green"
                    onClick={() => removeDevice(index)}
                  >
                    <Icon name="trash" />
                  </IconButton>
                </Tooltip>
              </GroupDeviceBox>
            ))}
          </>
        ) : (
          <Center flex="1">
            <Stack alignItems="center" gap="4">
              <Stack alignItems="center" gap="1">
                <Heading size="md">{t("noDevicesSelected")}</Heading>
                <Text color="grey.400">
                  {t("pleaseAddEquipmentUsingTheAutoCompleteAbove")}
                </Text>
              </Stack>
            </Stack>
          </Center>
        )}
      </Stack>
    </>
  )
}
