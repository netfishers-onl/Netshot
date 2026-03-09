import api from "@/api"
import { DataTable, EmptyResult, Icon, Protected, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { usePagination } from "@/hooks"
import { HardwareRule, Level } from "@/types"
import { formatDate, search } from "@/utils"
import { Button, Heading, IconButton, Skeleton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import AddHardwareRuleButton from "../components/AddHardwareRuleButton"
import EditHardwareRuleButton from "../components/EditHardwareRuleButton"
import RemoveHardwareRuleButton from "../components/RemoveHardwareRuleButton"
import { QUERIES } from "../constants"

const columnHelper = createColumnHelper<HardwareRule>()

export default function ComplianceHardwareRuleScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()

  const { data: rules, isPending } = useQuery({
    queryKey: [QUERIES.HARDWARE_RULE_LIST, pagination.query],
    queryFn: api.hardwareRule.getAll,
    select: useCallback(
      (res: HardwareRule[]): HardwareRule[] => {
        return search(res, "deviceType", "family").with(pagination.query)
      },
      [pagination.query]
    ),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("targetGroup", {
        cell: (info) => <Text>{info.getValue()?.name || t("[Any]")}</Text>,
        header: t("Group"),
        size: 20000,
      }),
      columnHelper.accessor("deviceType", {
        cell: (info) => <Text>{info.getValue() || t("[Any]")}</Text>,
        header: t("Device type"),
        size: 20000,
      }),
      columnHelper.accessor("family", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Device family"),
        size: 20000,
      }),
      columnHelper.accessor("partNumber", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Part number"),
        size: 20000,
      }),
      columnHelper.accessor("endOfSale", {
        cell: (info) => (
          <Text>{info.getValue() ? formatDate(info.getValue(), "yyyy-MM-dd") : t("N/A")}</Text>
        ),
        header: t("End of sale"),
        size: 10000,
      }),
      columnHelper.accessor("endOfLife", {
        cell: (info) => (
          <Text>{info.getValue() ? formatDate(info.getValue(), "yyyy-MM-dd") : t("N/A")}</Text>
        ),
        header: t("End of life"),
        size: 10000,
      }),
      columnHelper.accessor((rule) => rule, {
        cell(info) {
          const rule = info.getValue()
          return (
            <Protected minLevel={Level.ReadWrite}>
              <Stack direction="row" gap="2">
                <EditHardwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip content={t("Edit")}>
                      <IconButton
                        variant="ghost"
                        colorPalette="green"
                        aria-label={t("Edit the rule")}
                        onClick={open}
                      >
                        <Icon name="edit" />
                      </IconButton>
                    </Tooltip>
                  )}
                />
                <RemoveHardwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip content={t("Remove")}>
                      <IconButton
                        variant="ghost"
                        colorPalette="green"
                        aria-label={t("Remove the rule")}
                        onClick={open}
                      >
                        <Icon name="trash" />
                      </IconButton>
                    </Tooltip>
                  )}
                />
              </Stack>
            </Protected>
          )
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
  )

  return (
    <Stack gap="6" p="9" flex="1" overflow="auto">
      <Heading as="h1" fontSize="4xl">
        {t("Hardware support status")}
      </Heading>
      <Stack direction="row" gap="3">
        <Search
          placeholder={t("Search...")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
        <Protected minLevel={Level.ReadWrite}>
          <Skeleton loading={!!isPending}>
            <AddHardwareRuleButton
              renderItem={(open) => (
                <Button onClick={open} variant="primary">
                  <Icon name="plus" />
                  {t("Add rule")}
                </Button>
              )}
            />
          </Skeleton>
        </Protected>
      </Stack>
      {isPending ? (
        <Stack gap="3">
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
              description={t("You can add rule to check device hardware compliance")}
            >
              <AddHardwareRuleButton
                renderItem={(open) => (
                  <Button onClick={open} variant="primary">
                    <Icon name="plus" />
                    {t("Add rule")}
                  </Button>
                )}
              />
            </EmptyResult>
          )}
        </>
      )}
    </Stack>
  )
}
