import { Separator, Stack } from "@chakra-ui/react"
import { useEffect } from "react"
import { Outlet, useMatch } from "react-router"
import { DeviceSidebar } from "../components"
import { useDeviceSidebarStore } from "../stores"
import DeviceBulkActionScreen from "./DeviceBulkActionScreen"

export default function DeviceScreen() {
  const selected = useDeviceSidebarStore((state) => state.selected)
  const deselectAll = useDeviceSidebarStore((state) => state.deselectAll)
  const isMultipleDeviceSelected = selected?.length > 1
  const isOnDeviceRoot = !useMatch("/app/devices/:id/*")

  useEffect(() => {
    if (isOnDeviceRoot) {
      deselectAll()
    }
  }, [isOnDeviceRoot, deselectAll])

  return (
    <Stack direction="row" flex="1" overflow="auto" gap="0">
      <DeviceSidebar />
      <Separator orientation="vertical" />
      <Stack flex="1" overflow="auto">
        {isMultipleDeviceSelected ? <DeviceBulkActionScreen /> : <Outlet />}
      </Stack>
    </Stack>
  )
}
