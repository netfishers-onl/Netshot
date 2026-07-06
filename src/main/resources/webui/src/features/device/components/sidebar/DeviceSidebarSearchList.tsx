import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/react/shallow"
import { useSearchDevices } from "../../api"
import { useDeviceSidebarStore } from "../../stores"
import DeviceBox from "./DeviceBox"

export default function DeviceSidebarSearchList() {
  const { query, setTotal, setDevices } = useDeviceSidebarStore(
    useShallow((state) => ({
      query: state.query,
      setTotal: state.setTotal,
      setDevices: state.setDevices,
    }))
  )

  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isPending, isSuccess } = useSearchDevices(query)

  const devices = isSuccess ? (data?.devices ?? []) : []

  useEffect(() => {
    if (isSuccess) {
      setTotal(devices.length)
      setDevices(devices)
    }
  }, [isSuccess, setTotal, setDevices, devices])

  const virtualizer = useVirtualizer({
    count: devices.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 76,
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

  if (devices?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("device.noDeviceFound")}</Text>
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
            const device = devices[virtualItem.index]

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
