import { createContext, use } from "react"

import { Device, DeviceType } from "@/types"

export type DeviceContextType = {
  device: Device
  type: DeviceType
  isLoading: boolean
  isDisabled?: boolean
}

export const DeviceContext = createContext<DeviceContextType>(null!)
export const useDevice = () => use(DeviceContext)
