import { createContext, Dispatch, SetStateAction, useContext } from "react";

import { DeviceType, Group, Option, SimpleDevice } from "@/types";

export type DeviceSidebarContextType = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  driver: Option<DeviceType>;
  setDriver: Dispatch<SetStateAction<Option<DeviceType>>>;
  total: number;
  setTotal: Dispatch<SetStateAction<number>>;
  selected: SimpleDevice[];
  setSelected: Dispatch<SetStateAction<SimpleDevice[]>>;
  data: SimpleDevice[];
  setData: Dispatch<SetStateAction<SimpleDevice[]>>;
  selectAll(): void;
  deselectAll(): void;
  isSelectedAll(): boolean;
  isSelected(deviceId: number): boolean;
  group: Group;
  setGroup: Dispatch<SetStateAction<Group>>;
  updateQueryAndDriver(opts: {
    query: string;
    driver: Option<DeviceType>;
  }): void;
  refreshDeviceList(): Promise<void>;
};

export const DeviceSidebarContext =
	createContext<DeviceSidebarContextType>(null);
export const useDeviceSidebar = () => useContext(DeviceSidebarContext);
