import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Protected, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { HardwareRule, Level } from "@/types";
import { formatDate, search } from "@/utils";
import {
  Button,
  Heading,
  IconButton,
  Skeleton,
  Spacer,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AddHardwareRuleButton from "../components/AddHardwareRuleButton";
import EditHardwareRuleButton from "../components/EditHardwareRuleButton";
import RemoveHardwareRuleButton from "../components/RemoveHardwareRuleButton";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<HardwareRule>();

export default function ComplianceHardwareRuleScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data: rules, isPending } = useQuery({
    queryKey: [QUERIES.HARDWARE_RULE_LIST, pagination.query],
    queryFn: api.hardwareRule.getAll,
    select: useCallback((res: HardwareRule[]): HardwareRule[] => {
      return search(res, "deviceType", "family").with(pagination.query);
    }, [pagination.query]),
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("targetGroup", {
        cell: (info) => info.getValue()?.name || t("[Any]"),
        header: t("Group"),
        size: 20000,
      }),
      columnHelper.accessor("deviceType", {
        cell: (info) => info.getValue() || t("[Any]"),
        header: t("Device type"),
        size: 20000,
      }),
      columnHelper.accessor("family", {
        cell: (info) => info.getValue(),
        header: t("Device family"),
        size: 20000,
      }),
      columnHelper.accessor("partNumber", {
        cell: (info) => info.getValue(),
        header: t("Part number"),
        size: 20000,
      }),
      columnHelper.accessor("endOfSale", {
        cell: (info) =>
          info.getValue()
            ? formatDate(info.getValue(), "yyyy-MM-dd")
            : t("N/A"),
        header: t("End of sale"),
        size: 10000,
      }),
      columnHelper.accessor("endOfLife", {
        cell: (info) =>
          info.getValue()
            ? formatDate(info.getValue(), "yyyy-MM-dd")
            : t("N/A"),
        header: t("End of life"),
        size: 10000,
      }),
      columnHelper.accessor((rule) => rule, {
        cell(info) {
          const rule = info.getValue();
          return (
            <Protected minLevel={Level.ReadWrite}>
              <Stack direction="row" spacing="2">
                <EditHardwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip label={t("Edit")}>
                      <IconButton
                        variant="ghost"
                        colorScheme="green"
                        aria-label={t("Edit the rule")}
                        icon={<Icon name="edit" />}
                        onClick={open}
                      />
                    </Tooltip>
                  )}
                />
                <RemoveHardwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip label={t("Remove")}>
                      <IconButton
                        variant="ghost"
                        colorScheme="green"
                        aria-label={t("Remove the rule")}
                        icon={<Icon name="trash" />}
                        onClick={open}
                      />
                    </Tooltip>
                  )}
                />
              </Stack>
            </Protected>
          );
        },
        id: "actions",
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
        minSize: 80,
        size: 200,
      }),
    ],
    [t, rules]
  );

  return (
    <Stack spacing="6" p="9" flex="1" overflow="auto">
      <Heading as="h1" fontSize="4xl">
        {t("Hardware support status")}
      </Heading>
      <Stack direction="row" spacing="3">
        <Search
          placeholder={t("Search...")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
        <Protected minLevel={Level.ReadWrite}>
          <Skeleton isLoaded={!isPending}>
            <AddHardwareRuleButton
              renderItem={(open) => (
                <Button
                  onClick={open}
                  variant="primary"
                  leftIcon={<Icon name="plus" />}
                >
                  {t("Add rule")}
                </Button>
              )}
            />
          </Skeleton>
        </Protected>
      </Stack>
      {isPending ? (
        <Stack spacing="3">
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
        </Stack>
      ) : (
        <>
          {rules?.length > 0 ? (
            <DataTable columns={columns} data={rules} loading={isPending} />
          ) : (
            <EmptyResult
              title={t("There is no hardware rule")}
              description={t(
                "You can add rule to check device hardware compliance"
              )}
            >
              <AddHardwareRuleButton
                renderItem={(open) => (
                  <Button
                    onClick={open}
                    variant="primary"
                    leftIcon={<Icon name="plus" />}
                  >
                    {t("Add rule")}
                  </Button>
                )}
              />
            </EmptyResult>
          )}
        </>
      )}
    </Stack>
  );
}
