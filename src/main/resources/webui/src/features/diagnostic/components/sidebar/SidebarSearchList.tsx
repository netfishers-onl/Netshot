import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import useToast from "@/hooks/useToast";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../../constants";
import { useDiagnosticSidebar } from "../../contexts/DiagnosticSidebarProvider";
import SidebarBox from "./SidebarBox";
import { useCallback, useEffect } from "react";
import { Diagnostic } from "@/types";
import { search } from "@/utils";

export default function DeviceSidebarSearchList() {
  const ctx = useDiagnosticSidebar();
  const toast = useToast();
  const { t } = useTranslation();

  const { data, isPending, isSuccess } = useQuery({
    queryKey: [QUERIES.DIAGNOSTIC_SEARCH_LIST, ctx.query],
    queryFn: async () => {
      return api.diagnostic.getAll();
    },
    select: useCallback((res: Diagnostic[]): Diagnostic[] => {
      return search(res, "name").with(ctx.query);
    }, [ctx.query]),
  });

  useEffect(() => {
    if (isSuccess) {
      ctx.setTotal(data.length);
      ctx.setData(data);
    }
  }, [isSuccess, data, ctx]);

  if (isPending) {
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
