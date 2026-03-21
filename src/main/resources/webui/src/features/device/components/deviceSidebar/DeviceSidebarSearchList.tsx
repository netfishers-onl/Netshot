import { Center, Spinner, Stack, Text } from "@chakra-ui/react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"
import { useShallow } from "zustand/react/shallow"
import { useInfiniteSearchDevices } from "../../api"
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

  const { ref, inView } = useInView()
  const { t } = useTranslation()

  const { data, isPending, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteSearchDevices(query)

  const devices = isSuccess ? data?.pages?.flatMap((page) => page?.devices) : []

  useEffect(() => {
    if (isSuccess && data) {
      setTotal(devices?.length ?? 0)
      setDevices(devices)
    }
  }, [isSuccess, data, setTotal, setDevices, devices])

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

  if (devices?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("noDeviceFound")}</Text>
      </Center>
    )
  }

  return (
    <Stack p="6" gap="3" overflow="auto" flex="1">
      {isSuccess &&
        data?.pages?.map((page) =>
          page.devices.map((device, i) => {
            if (page.devices.length === i + 1) {
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
