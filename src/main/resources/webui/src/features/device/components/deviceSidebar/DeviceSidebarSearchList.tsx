import api from "@/api";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../../constants";
import { useDeviceSidebar } from "../../contexts/device-sidebar";
import DeviceBox from "./DeviceBox";
import { useEffect } from "react";

export default function DeviceSidebarSearchList() {
  const ctx = useDeviceSidebar();
  const { t } = useTranslation();

  const { data, isPending, isSuccess } = useQuery({
    queryKey: [QUERIES.DEVICE_SEARCH_LIST, ctx.query, ctx.driver?.value?.name],
    queryFn: async () => {
      return api.device.search({
        driver: ctx.driver?.value?.name,
        query: ctx.query,
      });
    },
  });

  useEffect(() => {
    ctx.setTotal(data?.devices?.length);
    ctx.setData(data?.devices);
  }, [isSuccess, data?.devices, ctx.setData, ctx.setTotal, ctx]);

  if (isPending) {
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
