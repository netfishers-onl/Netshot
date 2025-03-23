import api, { PaginationQueryParams } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { EmptyResult } from "@/components";
import Search from "@/components/Search";
import { useToast } from "@/hooks";
import { Button, Skeleton, Stack } from "@chakra-ui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import DeviceConfigurationPanel from "../components/DeviceConfigurationPanel";
import { QUERIES } from "../constants";

const LIMIT = 25;

export default function DeviceConfigurationScreen() {
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState<string>("");

  const {
    data,
    isLoading,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERIES.DEVICE_CONFIGS, params.id, query],
    queryFn: async ({ pageParam }) => {
      const pagination = {
        limit: LIMIT,
        offset: pageParam,
      } as PaginationQueryParams;

      return api.device.getAllConfigsById(+params.id, pagination);
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === LIMIT ? allPages.length * LIMIT : undefined;
    },
  });

  const onQuery = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const onQueryClear = useCallback(() => {
    setQuery("");
  }, []);

  if (data?.pages?.[0]?.length === 0) {
    return (
      <EmptyResult
        title={t("There is no configuration for this device")}
        description={t(
          "This device does not have any configuration, please run a snapshot"
        )}
      />
    );
  }

  return (
    <Stack spacing="6">
      <Stack direction="row" spacing="3">
        <Search
          placeholder={t("Search...")}
          onQuery={onQuery}
          onClear={onQueryClear}
          w="50%"
        />
      </Stack>
      <Stack spacing="3">
        {isLoading ? (
          <>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
          </>
        ) : (
          <>
            {isSuccess &&
              data?.pages?.map((page) =>
                page.map((config) => (
                  <DeviceConfigurationPanel config={config} key={config?.id} />
                ))
              )}
          </>
        )}
      </Stack>
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} isLoading={isFetchingNextPage}>
          {t("Load more")}
        </Button>
      )}
    </Stack>
  );
}
