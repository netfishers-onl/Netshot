import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"

import { useShallow } from "zustand/react/shallow"
import { useInfiniteDevices } from "../../api"
import { useDeviceSidebarStore } from "../../stores"
import DeviceBox from "./DeviceBox"

export default function DeviceSidebarList() {
  const { ref, inView } = useInView()
  const { t } = useTranslation()
  const { setTotal, setDevices, group } = useDeviceSidebarStore(
    useShallow((state) => ({
      setTotal: state.setTotal,
      setDevices: state.setDevices,
      group: state.group,
    }))
  )

  const { data, isPending, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteDevices(group?.id)

  useEffect(() => {
    if (isSuccess) {
      const devices = data.pages.flat()
      setTotal(devices.length)
      setDevices(devices)
    }
  }, [isSuccess, data?.pages, setTotal, setDevices])

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage])

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    )
  }

  if (data?.pages?.[0]?.length === 0) {
    return (
      <Center flex="1">
        <Text>
          {group ? t("noDeviceInGroup", { group: group?.name }) : t("noDeviceFound")}
        </Text>
      </Center>
    )
  }

  return (
    <Stack p="6" gap="1" overflow="auto" flex="1">
      {isSuccess &&
        data?.pages?.map((page) =>
          page.map((device, i) => {
            if (page.length === i + 1) {
              return <DeviceBox ref={ref} device={device} key={device?.id} />
            }

            return <DeviceBox device={device} key={device?.id} />
          })
        )}
      {isFetchingNextPage && (
        <Stack alignItems="center" justifyContent="center" py="6">
          <Spinner />
        </Stack>
      )}
    </Stack>
  )
}
