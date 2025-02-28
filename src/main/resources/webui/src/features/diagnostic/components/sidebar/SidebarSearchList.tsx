import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import useToast from "@/hooks/useToast";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../../constants";
import { useDiagnosticSidebar } from "../../contexts/DiagnosticSidebarProvider";
import SidebarBox from "./SidebarBox";

export default function DeviceSidebarSearchList() {
  const ctx = useDiagnosticSidebar();
  const toast = useToast();
  const { t } = useTranslation();
  const { data, isLoading } = useQuery(
    [QUERIES.DIAGNOSTIC_SEARCH_LIST, ctx.query],
    async () => {
      return api.diagnostic.getAll();
    },
    {
      select(res) {
        return res.filter((diagnostic) =>
          diagnostic.name.startsWith(ctx.query)
        );
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
      onSuccess(res) {
        ctx.setTotal(res?.length);
        ctx.setData(res);
      },
    }
  );

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6">
        <Spinner />
      </Stack>
    );
  }

  if (data?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("No diagnostic found")}</Text>
      </Center>
    );
  }

  return (
    <Stack p="6" spacing="1" overflow="auto">
      {data?.map((diagnostic) => (
        <SidebarBox diagnostic={diagnostic} key={diagnostic?.id} />
      ))}
    </Stack>
  );
}
