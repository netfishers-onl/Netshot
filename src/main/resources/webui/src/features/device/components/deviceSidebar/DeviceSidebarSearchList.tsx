import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import useToast from "@/hooks/useToast";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../../constants";
import { useDeviceSidebar } from "../../contexts/DeviceSidebarProvider";
import DeviceBox from "./DeviceBox";

export default function DeviceSidebarSearchList() {
  const ctx = useDeviceSidebar();
  const toast = useToast();
  const { t } = useTranslation();
  const { data, isLoading } = useQuery(
    [QUERIES.DEVICE_SEARCH_LIST, ctx.query, ctx.driver?.value?.name],
    async () => {
      return api.device.search({
        driver: ctx.driver?.value?.name,
        query: ctx.query,
      });
    },
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
      onSuccess(res) {
        ctx.setTotal(res?.devices?.length);
        ctx.setData(res?.devices);
      },
    }
  );

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    );
  }

  if (data?.devices?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("No device found")}</Text>
      </Center>
    );
  }

  return (
    <Stack p="6" spacing="3" overflow="auto" flex="1">
      {data?.devices?.map((device) => (
        <DeviceBox device={device} key={device?.id} />
      ))}
    </Stack>
  );
}
