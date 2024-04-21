import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSidebar } from "../../contexts/SidebarProvider";
import PolicyItem from "../PolicyItem";

export default function SidebarSearchList() {
  const ctx = useSidebar();
  const toast = useToast();
  const { t } = useTranslation();
  const { data: policies, isLoading } = useQuery(
    [QUERIES.POLICY_LIST, ctx.query],
    async () => {
      return api.policy.getAll();
    },
    {
      select(res) {
        return res.filter(
          (policy) =>
            policy.name.toLowerCase().startsWith(ctx.query.toLowerCase()) ||
            policy.name.toLowerCase().includes(ctx.query.toLowerCase())
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
