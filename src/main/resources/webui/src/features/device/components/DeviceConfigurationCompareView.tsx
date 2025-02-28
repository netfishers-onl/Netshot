import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { EmptyResult } from "@/components";
import ConfigurationCompareEditor from "@/components/ConfigurationCompareEditor";
import Search from "@/components/Search";
import { useToast } from "@/hooks";
import { DeviceConfig } from "@/types";
import { Skeleton, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import DeviceConfigurationCompareItem from "./DeviceConfigurationCompareItem";

export type DeviceConfigurationCompareViewProps = {
  id: number;
  config: DeviceConfig;
};

export default function DeviceConfigurationCompareView(
  props: DeviceConfigurationCompareViewProps
) {
  const { config, id } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<DeviceConfig>(null);
  const [pagination, setPagination] = useState({
    limit: 40,
    offset: 1,
  });
  const { data: configs, isLoading } = useQuery(
    [QUERIES.DEVICE_CONFIGS, query, pagination.offset, +id],
    async () => api.device.getAllConfigById(+id, pagination),
    {
      select(data) {
        return data.filter((item) => item?.id !== config?.id);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
      onSuccess(data) {
        setSelected(data?.[0]);
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
    <Stack direction="row" spacing="7" overflow="auto" flex="1">
      <Stack w="340px" overflow="auto">
        <Search
          onQuery={onQuery}
          onClear={onQueryClear}
          placeholder={t("Search...")}
        />
        <Stack spacing="2" overflow="auto" flex="1">
          {isLoading ? (
            <Stack spacing="3">
              <Skeleton h="60px"></Skeleton>
              <Skeleton h="60px"></Skeleton>
              <Skeleton h="60px"></Skeleton>
              <Skeleton h="60px"></Skeleton>
            </Stack>
          ) : (
            <>
              {configs?.length ? (
                <>
                  {configs?.map((config) => (
                    <DeviceConfigurationCompareItem
                      key={config?.id}
                      config={config}
                      onClick={() => setSelected(config)}
                      isSelected={config?.id === selected?.id}
                    />
                  ))}
                </>
              ) : (
                <EmptyResult
                  title={t("No configuration to compare")}
                  description={t(
                    "Config list will be appears here when device changes"
                  )}
                />
              )}
            </>
          )}
        </Stack>
      </Stack>

      {selected && (
        <ConfigurationCompareEditor current={config} compare={selected} />
      )}
    </Stack>
  );
}
