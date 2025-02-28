import { Device, DeviceStatus } from "@/types";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";

export type DeviceContextType = {
  device: Device;
  isLoading: boolean;
  isDisabled?: boolean;
};

export const DeviceContext = createContext<DeviceContextType>(null);
export const useDevice = () => useContext(DeviceContext);

export default function DeviceProvider(
  props: PropsWithChildren<DeviceContextType>
) {
  const { children, device, isLoading } = props;

  const isDisabled = useMemo(
    () => device?.status === DeviceStatus.Disabled,
    [device]
  );

  const ctx = { device, isLoading, isDisabled };

  return (
    <DeviceContext.Provider value={ctx}>{children}</DeviceContext.Provider>
  );
}
