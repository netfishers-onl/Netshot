import { Badge, HoverCard, Spacer, Stack, Tag, Text } from "@chakra-ui/react"
import { forwardRef, MouseEvent, Ref, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMatch, useNavigate, useParams } from "react-router"

import { Icon } from "@/components"
import { DeviceSoftwareLevel, DeviceStatus, SimpleDevice } from "@/types"
import { getSoftwareLevelColor } from "@/utils"

import { useDeviceLevelOptions } from "@/hooks"
import { useShallow } from "zustand/react/shallow"
import { useDeviceSidebarStore } from "../../stores"

type DeviceBoxProps = {
  device: SimpleDevice
}

const DeviceBox = forwardRef((props: DeviceBoxProps, ref: Ref<HTMLDivElement>) => {
  const { device } = props

  const { t } = useTranslation()
  const deviceSidebarStore = useDeviceSidebarStore(
    useShallow((state) => ({
      isSelected: state.isSelected,
      select: state.select,
      selected: state.selected,
      devices: state.devices,
    }))
  )

  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const deviceLevelOptions = useDeviceLevelOptions()
  const sectionMatch = useMatch("/app/devices/:id/:section")
  const currentSection = sectionMatch?.params.section ?? "general"
  const isSelected = deviceSidebarStore.isSelected(device?.id) || +params?.id === device?.id
  const isDisabled = device?.status === DeviceStatus.Disabled

  /**
   * Device selection logic
   * @description
   * click: select a device
   * cmd+click: select device by device
   * shift+click: select device range
   */
  const onSelected = (evt: MouseEvent<HTMLDivElement>) => {
    if (evt.metaKey) {
      if (deviceSidebarStore.isSelected(device.id)) {
        deviceSidebarStore.select(deviceSidebarStore.selected.filter((d) => d.id !== device.id))
      } else {
        deviceSidebarStore.select([...deviceSidebarStore.selected, device])
      }
    } else if (evt.shiftKey) {
      if (deviceSidebarStore.selected.length === 0) {
        return
      }

      const firstIndex = deviceSidebarStore.devices.findIndex(
        (d) => d.id === deviceSidebarStore.selected[0].id
      )
      const lastIndex = deviceSidebarStore.devices.findIndex((d) => d.id === device.id)

      if (lastIndex === -1) {
        return
      }

      const dataClone = [...deviceSidebarStore.devices]
      let range: SimpleDevice[] = []

      if (firstIndex < lastIndex) {
        range = dataClone.slice(firstIndex, lastIndex + 1)
      } else {
        range = dataClone.slice(lastIndex, firstIndex)
      }

      deviceSidebarStore.select(range)
    } else {
      navigate(`./${device?.id}/${currentSection}`)
      deviceSidebarStore.select([device])
    }
  }

  const level = useMemo(() => deviceLevelOptions.getByValue(device?.softwareLevel), [device])

  const compliant = useMemo<boolean>(() => {
    if (
      [DeviceSoftwareLevel.NON_COMPLIANT, DeviceSoftwareLevel.UNKNOWN].includes(
        device.softwareLevel
      )
    ) {
      return false
    }

    if (!device.configCompliant) {
      return false
    }

    if (device.eol) {
      return false
    }

    if (device.eos) {
      return false
    }

    return true
  }, [device])

  const family = device?.family === "" ? t("unknown3") : device?.family

  return (
    <Stack
      onClick={onSelected}
      gap="2"
      px="2"
      py="2"
      bg={isSelected ? "green.50" : "white"}
      transition="all .2s ease"
      _hover={{
        bg: isSelected ? "green.50" : "grey.50",
      }}
      borderRadius="xl"
      ref={ref}
      userSelect="none"
      cursor="pointer"
    >
      <Stack gap="0">
        <Text
          opacity={isDisabled ? 0.5 : 1}
          fontSize="xs"
          color={isSelected ? "green.500" : "grey.400"}
        >
          {device?.mgmtAddress}
        </Text>
        <Text opacity={isDisabled ? 0.5 : 1} fontWeight="medium">
          {device?.name}
        </Text>
      </Stack>
      <Stack direction="row" gap="3">
        <Badge
          opacity={isDisabled ? 0.5 : 1}
          alignSelf="start"
          colorPalette={isSelected ? "green" : "grey"}
          variant="surface"
        >
          {family}
        </Badge>
        <Spacer />

        <HoverCard.Root>
          <HoverCard.Trigger asChild>
            {compliant ? (
              <Tag.Root gap="1" colorPalette="green">
                <Icon size={14} name="checkCircle" />
              </Tag.Root>
            ) : (
              <Tag.Root gap="1" colorPalette="red">
                <Icon size={14} name="alertTriangle" />
              </Tag.Root>
            )}
          </HoverCard.Trigger>
          <HoverCard.Positioner>
            <HoverCard.Content w="340px">
              <Text fontSize="md" fontWeight="bold" mb="3">
                {t("statusSummary")}
              </Text>
              <Stack gap="2">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Text>{t("softwareCompliance")}</Text>
                  <Tag.Root colorPalette={getSoftwareLevelColor(level?.value)}>
                    {level?.label}
                  </Tag.Root>
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Text>{t("configurationCompliance")}</Text>
                  <Tag.Root colorPalette={device.configCompliant ? "green" : "red"}>
                    {t(device.configCompliant ? "compliant" : "nonCompliant")}
                  </Tag.Root>
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Text>{t("hardwareCompliance")}</Text>
                  <Tag.Root colorPalette={device.eos || device.eol ? "red" : "green"}>
                    {device.eol
                      ? t("endOfLife")
                      : device.eos
                        ? t("endOfSale")
                        : t("upToDate")}
                  </Tag.Root>
                </Stack>
              </Stack>
            </HoverCard.Content>
          </HoverCard.Positioner>
        </HoverCard.Root>
      </Stack>
    </Stack>
  )
})

export default DeviceBox
