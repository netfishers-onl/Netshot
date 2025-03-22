import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../../contexts/SidebarProvider";
import PolicyItem from "../PolicyItem";
import { useEffect } from "react";

export default function SidebarSearchList() {
  const ctx = useSidebar();
  const toast = useToast();
  const { t } = useTranslation();

  const { data: policies, isPending, isSuccess } = useQuery({
    queryKey: [QUERIES.POLICY_LIST, ctx.query],
    queryFn: async () => {
      return api.policy.getAllWithRules(ctx.query);
    },
  });

  useEffect(() => {
    if (isSuccess) {
      ctx.setTotal(policies?.length);
      ctx.setData(policies);
    }
  }, [policies, isSuccess]);

  if (isPending) {
    return (
      <Stack alignItems="center" justifyContent="center" py="6">
        <Spinner />
      </Stack>
    );
  }

  if (policies?.length === 0) {
    return (
      <Center flex="1">
        <Text>{t("No policy found")}</Text>
      </Center>
    );
  }

  return (
    <Stack p="6" spacing="3" overflow="auto">
      {policies?.map((policy) => (
        <PolicyItem key={policy?.id} policy={policy} />
      ))}
    </Stack>
  );
}
