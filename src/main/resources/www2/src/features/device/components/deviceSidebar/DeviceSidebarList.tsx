import device, { DeviceQueryParams } from "@/api/device";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { useLocation } from "react-router-dom";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";
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
  const ctx = useDeviceSidebar();
  const {
    data,
    isLoading,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    [QUERIES.DEVICE_LIST, ctx.group?.id],
    async ({ pageParam = 0 }) => {
      const params = {
        limit: LIMIT,
        offset: pageParam,
      } as DeviceQueryParams;

      const queryParams = new URLSearchParams(location.search);

      if (queryParams.has("group")) {
        params.group = parseInt(queryParams.get("group"));
      }

      return device.getAll(params);
    },
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
      getNextPageParam(lastPage, allPages) {
        return lastPage.length === LIMIT ? allPages.length + 1 : undefined;
      },
    }
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    );
  }

  if (data.pages?.[0]?.length === 0) {
    return (
      <Center flex="1">
        <Text>
          {ctx.group
            ? t("No device in group {{group}}", { group: ctx.group.name })
            : t("No device found")}
        </Text>
      </Center>
    );
  }

  return (
    <Stack p="6" spacing="3" overflow="auto" flex="1">
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
