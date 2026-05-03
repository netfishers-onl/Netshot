import api from "@/api"
import { DataTable, EmptyResult, Protected, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { usePagination } from "@/hooks"
import { HardwareRule, Level } from "@/types"
import { formatDate, search } from "@/utils"
import { Button, Heading, IconButton, Skeleton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import AddHardwareRuleButton from "../components/AddHardwareRuleButton"
import EditHardwareRuleButton from "../components/EditHardwareRuleButton"
import RemoveHardwareRuleButton from "../components/RemoveHardwareRuleButton"
import { QUERIES } from "../constants"
import TableButtonStack from "@/features/administration/components/TableButtonStack"

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
        cell: (info) => <Text>{info.getValue()?.name || t("common.any")}</Text>,
        header: t("group.label"),
        size: 20000,
      }),
      columnHelper.accessor("type", {
        cell: (info) => <Text>{info.getValue() || t("common.any")}</Text>,
        header: t("device.type"),
        size: 20000,
      }),
      columnHelper.accessor("family", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("device.family"),
        size: 20000,
      }),
      columnHelper.accessor("partNumber", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("device.module.partNumber"),
        size: 20000,
      }),
      columnHelper.accessor("endOfSale", {
        cell: (info) => (
          <Text>{info.getValue() ? formatDate(info.getValue(), "yyyy-MM-dd") : t("common.nA")}</Text>
        ),
        header: t("compliance.hardware.endOfSale"),
        size: 10000,
      }),
      columnHelper.accessor("endOfLife", {
        cell: (info) => (
          <Text>{info.getValue() ? formatDate(info.getValue(), "yyyy-MM-dd") : t("common.nA")}</Text>
        ),
        header: t("compliance.hardware.endOfLife"),
        size: 10000,
      }),
      columnHelper.accessor((rule) => rule, {
        cell(info) {
          const rule = info.getValue()
          return (
            <Protected minLevel={Level.ReadWrite}>
              <TableButtonStack>
                <EditHardwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip content={t("common.edit")}>
                      <IconButton
                        variant="ghost"
                        colorPalette="green"
                        aria-label={t("policy.rule.editThe")}
                        onClick={open}
                      >
                        <FiEdit />
                      </IconButton>
                    </Tooltip>
                  )}
                />
                <RemoveHardwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip content={t("common.remove")}>
                      <IconButton
                        variant="ghost"
                        colorPalette="green"
                        aria-label={t("policy.rule.removeThe")}
                        onClick={open}
                      >
                        <FiTrash />
                      </IconButton>
                    </Tooltip>
                  )}
                />
              </TableButtonStack>
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
        {t("compliance.hardware.supportStatus")}
      </Heading>
      <Stack direction="row" gap="3">
        <Search
          placeholder={t("common.searchPlaceholder")}
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
                  <FiPlus />
                  {t("policy.rule.add")}
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
              title={t("compliance.hardware.noRule")}
              description={t("compliance.hardware.canAddRule")}
            >
              <AddHardwareRuleButton
                renderItem={(open) => (
                  <Button onClick={open} variant="outline">
                    <FiPlus />
                    {t("policy.rule.add")}
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
