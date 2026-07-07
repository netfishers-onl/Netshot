import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { useShallow } from "zustand/react/shallow"
import { useDevices } from "../../api"
import { useDeviceSidebarStore } from "../../stores"
import DeviceBox from "./DeviceBox"

export default function DeviceSidebarList() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { setTotal, setDevices, group } = useDeviceSidebarStore(
    useShallow((state) => ({
      setTotal: state.setTotal,
      setDevices: state.setDevices,
      group: state.group,
    }))
  )

  const { data, isPending, isSuccess } = useDevices(group?.id)

  useEffect(() => {
    if (isSuccess) {
      setTotal(data.length)
      setDevices(data)
    }
  }, [isSuccess, data, setTotal, setDevices])

  const virtualizer = useVirtualizer({
    count: data?.length ?? 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 56,
    measureElement: (element) => element?.getBoundingClientRect().height,
    overscan: 10,
  })

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    )
  }

  if (data?.length === 0) {
    return (
      <Center flex="1">
        <Text>
          {group ? t("device.noDeviceInGroup", { group: group?.name }) : t("device.noDeviceFound")}
        </Text>
      </Center>
    )
  }

  return (
    <Stack ref={containerRef} gap="0" py="4" px="5" overflow="auto" flex="1">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {isSuccess &&
          virtualizer.getVirtualItems().map((virtualItem) => {
            const device = data?.[virtualItem.index]

            return (
              <DeviceBox
                ref={virtualizer.measureElement}
                device={device}
                key={device?.id}
                data-index={virtualItem.index}
                position="absolute"
                top="0"
                left="0"
                w="100%"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              />
            )
          })}
      </div>
    </Stack>
  )
}
