import { QUERIES } from "@/constants";
import { DeviceType, Group, Option, SimpleDevice } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { QUERIES as DEVICE_QUERIES } from "../constants";

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

export default function DeviceSidebarProvider(props: PropsWithChildren<{}>) {
  const { children } = props;
  const [query, setQuery] = useState<string>("");
  const [driver, setDriver] = useState<Option<DeviceType>>(null);
  const [total, setTotal] = useState<number>(0);
  const [selected, setSelected] = useState<SimpleDevice[]>([]);
  const [data, setData] = useState<SimpleDevice[]>([]);
  const [group, setGroup] = useState<Group>(null);
  const queryClient = useQueryClient();

  const selectAll = useCallback(() => {
    setSelected(data);
  }, [data]);

  const deselectAll = useCallback(() => {
    setSelected([]);
  }, []);

  const isSelected = useCallback(
    (deviceId: number) => {
      return Boolean(selected.find((item) => item.id === deviceId));
    },
    [selected]
  );

  const isSelectedAll = useCallback(() => selected?.length > 0, [selected]);

  const updateQueryAndDriver = useCallback(
    (opts: { query: string; driver: Option<DeviceType> }) => {
      setQuery(opts.query);
      setDriver(opts?.driver);
    },
    []
  );

  const refreshDeviceList = useCallback(async () => {
    await queryClient.invalidateQueries([QUERIES.DEVICE_LIST]);
    await queryClient.invalidateQueries([DEVICE_QUERIES.DEVICE_SEARCH_LIST]);
  }, [queryClient]);

  return (
    <DeviceSidebarContext.Provider
      value={{
        query,
        setQuery,
        driver,
        setDriver,
        total,
        setTotal,
        selected,
        setSelected,
        data,
        setData,
        selectAll,
        deselectAll,
        isSelectedAll,
        isSelected,
        group,
        setGroup,
        updateQueryAndDriver,
        refreshDeviceList,
      }}
    >
      {children}
    </DeviceSidebarContext.Provider>
  );
}
