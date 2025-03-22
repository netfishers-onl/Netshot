import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { getUniqueBy, sortAlphabetical } from "@/utils";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../../contexts/SidebarProvider";
import PolicyItem from "../PolicyItem";
import { useCallback } from "react";
import { Policy } from "@/types";
import { Icon } from "@/components";

export default function SidebarList() {
  const toast = useToast();
  const { t } = useTranslation();
  const ctx = useSidebar();

  const { data: policies, isPending } = useQuery({
    queryKey: [QUERIES.POLICY_LIST, ctx.query],
    queryFn: async () => api.policy.getAllWithRules(),
    select: useCallback((res: Policy[]): Policy[] => {
      /**
       * @note: Bug on policies, double creation when update...
       */
      const formatted = getUniqueBy(res, "name");
      return sortAlphabetical(formatted, "name");
    }, []),
  });

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6" flex="1">
        <Spinner />
      </Stack>
    );
  }

  if (policies?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("No diagnostic found")}</Text>
      </Center>
    );
  }

  return (
    <Stack p="6" spacing="0" overflow="auto" flex="1">
      {policies.map((policy) => (
        <PolicyItem key={policy?.id} policy={policy} />
      ))}
    </Stack>
  );
}
