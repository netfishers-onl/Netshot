import { useQueryClient } from "@tanstack/react-query";
import {
  PropsWithChildren,
  useCallback,
  useState,
} from "react";

import { QUERIES } from "@/constants";
import { DeviceType, Group, Option, SimpleDevice } from "@/types";

import { QUERIES as DEVICE_QUERIES } from "../constants";
import { DeviceSidebarContext, DeviceSidebarContextType } from "./device-sidebar";


export default function DeviceSidebarProvider(
    props: PropsWithChildren<DeviceSidebarContextType>) {
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

  const isSelected = useCallback((deviceId: number) => {
    return Boolean(selected.find((item) => item.id === deviceId));
  }, [selected]);

  const isSelectedAll = useCallback(
    () => (data.length > 0) && (data.length === selected.length),
    [data, selected]
  );

  const updateQueryAndDriver = useCallback(
    (opts: { query: string; driver: Option<DeviceType> }) => {
      setQuery(opts.query);
      setDriver(opts?.driver);
    },
    []
  );

  const refreshDeviceList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERIES.DEVICE_LIST] });
    await queryClient.invalidateQueries({ queryKey: [DEVICE_QUERIES.DEVICE_SEARCH_LIST] });
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
