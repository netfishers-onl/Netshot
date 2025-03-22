import { PropsWithChildren, useMemo } from "react";

import { DeviceStatus } from "@/types";

import { DeviceContext, DeviceContextType } from "./device";

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
