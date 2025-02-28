import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import QueryBuilderButton from "@/components/QueryBuilderButton";
import { QueryBuilderValue } from "@/components/QueryBuilderControl";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { DeviceType, Option } from "@/types";
import {
  Button,
  Center,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GroupDeviceBox from "./GroupDeviceBox";

export type DynamicGroupDeviceListProps = {
  driver: Option<DeviceType>;
  query: string;
  onUpdateQuery(values: QueryBuilderValue): void;
};

export default function DynamicGroupDeviceList(
  props: DynamicGroupDeviceListProps
) {
  const { query, driver, onUpdateQuery } = props;

  const { t } = useTranslation();
  const toast = useToast();

  const { data, isLoading } = useQuery(
    [QUERIES.DEVICE_GROUP_AGGREGATED_SEARCH, query, driver?.value?.name],
    async () => {
      return api.device.search({
        driver: driver?.value?.name,
        query,
      });
    },
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const isEmptyOrUndefined = useMemo(
    () => data === undefined || data?.devices?.length === 0,
    [data]
  );

  if (isEmptyOrUndefined) {
    return (
      <Center flex="1">
        <Stack alignItems="center" spacing="4">
          <Stack alignItems="center" spacing="1">
            <Heading size="md">{t("No results")}</Heading>
            <Text color="grey.400">{t("No device matching her criteria")}</Text>
          </Stack>

          <QueryBuilderButton
            renderItem={(open) => (
              <Button onClick={open}>{t("Edit query")}</Button>
            )}
            onSubmit={onUpdateQuery}
          />
        </Stack>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center flex="1">
        <Stack alignItems="center" spacing="4">
          <Spinner size="lg" />
          <Stack alignItems="center" spacing="1">
            <Heading size="md">{t("Loading")}</Heading>
            <Text color="grey.400">{t("Aggregating device in progress")}</Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  return data?.devices?.map((device, index) => (
    <GroupDeviceBox device={device} key={device?.id} />
  ));
}
