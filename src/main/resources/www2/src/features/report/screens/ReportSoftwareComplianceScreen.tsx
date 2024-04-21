import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DomainSelect, Icon, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { Option } from "@/types";
import {
  Button,
  Grid,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  Skeleton,
  Spacer,
  Stack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SoftwareComplianceItem } from "../components";
import { QUERIES } from "../constants";

type FilterForm = {
  domain: Option<number>;
};

export default function ReportSoftwareComplianceScreen() {
  const { t } = useTranslation();

  const toast = useToast();
  const pagination = usePagination();
  const form = useForm<FilterForm>({
    defaultValues: {
      domain: null,
    },
  });

  const domain = useWatch({
    control: form.control,
    name: "domain.value",
  });

  const { data, isLoading, refetch } = useQuery(
    [QUERIES.SOFTWARE_COMPLIANCE, pagination.query, domain],
    async () =>
      api.report.getAllGroupSoftwareComplianceStat(
        domain
          ? {
              domain,
            }
          : {}
      ),
    {
      select(res) {
        return res.filter((item) => {
          return (
            item.deviceCount > 0 &&
            (item.groupName.startsWith(pagination.query) ||
              item.groupName.includes(pagination.query))
          );
        });
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
      cacheTime: 0,
    }
  );

  const clearFilter = useCallback(() => {
    form.setValue("domain", null);
  }, [form]);

  return (
    <Stack spacing="8" p="9" flex="1" overflow="auto">
      <Heading as="h1" fontSize="4xl">
        {t("Configuration changes")}
      </Heading>
      <Stack direction="row" spacing="3">
        <Search
          placeholder={t("Search...")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
        <Menu>
          <MenuButton
            as={Button}
            variant="primary"
            leftIcon={<Icon name="filter" />}
          >
            {t("Filters")}
          </MenuButton>
          <MenuList minWidth="280px">
            <Stack spacing="6" p="3" as="form">
              <DomainSelect control={form.control} name="domain" />
              <Stack spacing="2">
                <Button onClick={clearFilter}>{t("Clear all")}</Button>
              </Stack>
            </Stack>
          </MenuList>
        </Menu>
        <Button onClick={() => refetch()} leftIcon={<Icon name="refreshCcw" />}>
          {t("Refresh")}
        </Button>
      </Stack>
      <Grid
        templateColumns={{
          base: "repeat(4, 1fr)",
          "2xl": "repeat(6, 1fr)",
        }}
        gap="6"
      >
        {isLoading ? (
          <>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
            <Skeleton w="100%" h="320px" borderRadius="3xl"></Skeleton>
          </>
        ) : (
          <>
            {data.map((item) => (
              <SoftwareComplianceItem key={item.groupId} item={item} />
            ))}
          </>
        )}
      </Grid>
    </Stack>
  );
}
