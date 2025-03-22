import { createContext, useContext } from "react";

import { Device } from "@/types";

export type DeviceContextType = {
	device: Device;
	isLoading: boolean;
	isDisabled?: boolean;
};

export const DeviceContext = createContext<DeviceContextType>(null);
export const useDevice = () => useContext(DeviceContext);
