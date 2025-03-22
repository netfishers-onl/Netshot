import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { useLocation } from "react-router";

import api, { DeviceQueryParams } from "@/api";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";

import { useDeviceSidebar } from "../../contexts/device-sidebar";
import DeviceBox from "./DeviceBox";

/**
 * @todo: Sort device by alphabetical order A-Z (backend)
 */
export default function DeviceSidebarList() {
  const { ref, inView } = useInView();
  const location = useLocation();
  const LIMIT = 40;
  const toast = useToast();
  const { t } = useTranslation();
  const { group, setData: setDevices, setTotal: setDeviceTotal } = useDeviceSidebar();

  const {
    data,
    isPending,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERIES.DEVICE_LIST, group?.id],
    queryFn: async ({ pageParam }) => {
      const params = {
        limit: LIMIT,
        offset: pageParam,
      } as DeviceQueryParams;

      const queryParams = new URLSearchParams(location.search);

      if (queryParams.has("group")) {
        params.group = parseInt(queryParams.get("group"));
      }

      return api.device.getAll(params);
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      // Note: lastPage may be null if first query returned 403
      return lastPage?.length === LIMIT ? allPages.length * LIMIT : undefined;
    },
  });

  useEffect(() => {
    if (isSuccess) {
      const devices = data.pages.flat();
      setDeviceTotal(devices.length);
      setDevices(devices);
    }
  }, [isSuccess, data?.pages, setDevices, setDeviceTotal]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    );
  }

  if (data?.pages?.[0]?.length === 0) {
    return (
      <Center flex="1">
        <Text>
          {group
            ? t("No device in group {{group}}", { group: group.name })
            : t("No device found")}
        </Text>
      </Center>
    );
  }

  return (
    <Stack p="6" spacing="1" overflow="auto" flex="1">
      {isSuccess &&
        data?.pages?.map((page) =>
          page.map((device, i) => {
            if (page.length === i + 1) {
              return <DeviceBox ref={ref} device={device} key={device?.id} />;
            }

            return <DeviceBox device={device} key={device?.id} />;
          })
        )}
      {isFetchingNextPage && (
        <Stack alignItems="center" justifyContent="center" py="6">
          <Spinner />
        </Stack>
      )}
    </Stack>
  );
}
