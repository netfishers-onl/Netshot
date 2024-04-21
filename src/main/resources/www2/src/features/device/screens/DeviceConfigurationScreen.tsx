import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { EmptyResult } from "@/components";
import Search from "@/components/Search";
import { useToast } from "@/hooks";
import { sortByDate } from "@/utils";
import { Skeleton, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import DeviceConfigurationPanel from "../components/DeviceConfigurationPanel";
import { QUERIES } from "../constants";

export default function DeviceConfigurationScreen() {
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState<string>("");
  const [pagination, setPagination] = useState({
    limit: 99999,
    offset: 1,
  });
  const { data: configs, isLoading } = useQuery(
    [QUERIES.DEVICE_CONFIGS, params.id, query, pagination.offset],
    async () => api.device.getAllConfigById(+params.id, pagination),
    {
      select(res) {
        return sortByDate(res, "changeDate");
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onQuery = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const onQueryClear = useCallback(() => {
    setQuery("");
  }, []);

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
            {configs?.length > 0 ? (
              <>
                {configs?.map((config) => (
                  <DeviceConfigurationPanel config={config} key={config?.id} />
                ))}
              </>
            ) : (
              <EmptyResult
                title={t("There is no interface for this device")}
                description={t(
                  "This device does not have any interface, please check his configuration"
                )}
              />
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
}
