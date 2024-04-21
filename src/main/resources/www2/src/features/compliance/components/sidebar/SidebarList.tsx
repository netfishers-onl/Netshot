import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import useToast from "@/hooks/useToast";
import { getUniqueBy, sortAlphabetical } from "@/utils";
import { Center, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import PolicyItem from "../PolicyItem";

export default function SidebarList() {
  const toast = useToast();
  const { t } = useTranslation();
  const { data: policies, isLoading } = useQuery(
    [QUERIES.POLICY_LIST],
    api.policy.getAll,
    {
      select(res) {
        /**
         * @note: Bug on policies, double creation when update...
         */
        const formatted = getUniqueBy(res, "name");
        return sortAlphabetical(formatted, "name");
      },
      onError(err: NetshotError) {
        toast.error(err);
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

  if (policies.length === 0) {
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
