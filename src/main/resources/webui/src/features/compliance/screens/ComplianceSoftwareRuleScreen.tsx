import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DataTable, EmptyResult, Protected, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { MUTATIONS } from "@/constants"
import { useAuth } from "@/contexts"
import { useConfirmDialogWithMutation } from "@/dialog"
import { usePagination, useToast } from "@/hooks"
import { Level, SoftwareRule } from "@/types"
import { getNextItemInArray, getSoftwareLevelColor, search } from "@/utils"
import { Button, Heading, IconButton, Skeleton, Spacer, Stack, Tag, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import AddSoftwareRuleButton from "../components/AddSoftwareRuleButton"
import EditSoftwareRuleButton from "../components/EditSoftwareRuleButton"
import RemoveSoftwareRuleButton from "../components/RemoveSoftwareRuleButton"
import { QUERIES } from "../constants"
import TableButtonStack from "@/features/administration/components/TableButtonStack"

const columnHelper = createColumnHelper<SoftwareRule>()

export default function ComplianceSoftwareRuleScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()
  const { user } = useAuth()
  const [data, setData] = useState<SoftwareRule[]>([])
  const dialog = useConfirmDialogWithMutation()
  const toast = useToast()
  const queryClient = useQueryClient()

  const {
    data: rules,
    isPending,
    isSuccess,
  } = useQuery({
    queryKey: [QUERIES.SOFTWARE_RULE_LIST, pagination.query],
    queryFn: api.softwareRule.getAll,
    select: (res: SoftwareRule[]): SoftwareRule[] => {
      return search(res, "deviceType", "family").with(pagination.query)
    },
  })

  useEffect(() => {
    if (isSuccess) {
      setData(rules)
    }
  }, [isSuccess, rules])

  const isDraggable = user?.level || 0 >= Level.ReadWrite

  const columns = [
    columnHelper.accessor("targetGroup", {
      cell: (info) => <Text>{info.getValue()?.name || t("common.any")}</Text>,
      header: t("group.label"),
      size: 10000,
    }),
    columnHelper.accessor("type", {
      cell: (info) => <Text>{info.getValue() || t("common.any")}</Text>,
      header: t("device.label"),
      size: 10000,
    }),
    columnHelper.accessor("family", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("device.family"),
      size: 10000,
    }),
    columnHelper.accessor("partNumber", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("device.module.partNumber"),
      size: 10000,
    }),
    columnHelper.accessor("version", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("common.version"),
      size: 10000,
    }),
    columnHelper.accessor("level", {
      cell: (info) => {
        const level = info.getValue()

        return <Tag.Root colorPalette={getSoftwareLevelColor(level)}>{level}</Tag.Root>
      },
      header: t("common.level"),
      size: 10000,
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => {
        const rule = info.row.original

        return (
          <Protected minLevel={Level.ReadWrite}>
            <TableButtonStack>
              <EditSoftwareRuleButton
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

              <RemoveSoftwareRuleButton
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
      header: "",
      enableSorting: false,
      meta: {
        align: "right",
      },
      minSize: 80,
      size: 200,
    }),
  ]

  const reorderMutation = useMutation({
    mutationKey: MUTATIONS.SOFTWARE_RULE_REORDER,
    mutationFn: ({ id, nextId }: { id: number; nextId: number }) => {
      return api.softwareRule.reorder(id, nextId)
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  function onDrop(row: SoftwareRule, reorderedData: SoftwareRule[]) {
    const id = row.id
    const nextItem = getNextItemInArray(row, reorderedData, "id")

    const dialogRef = dialog.open(MUTATIONS.SOFTWARE_RULE_REORDER, {
      title: t("common.changePriority"),
      description: t("policy.rule.confirmChangePriorities"),
      async onConfirm() {
        await reorderMutation.mutateAsync({ id: id, nextId: nextItem?.id })

        queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] })

        setData(reorderedData)

        dialogRef.close()
      },
    })
  }

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("compliance.software.versionLabel")}
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
              <AddSoftwareRuleButton
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
            {data?.length > 0 ? (
              <DataTable
                columns={columns}
                data={data}
                loading={isPending}
                draggable={isDraggable}
                primaryKey="id"
                onDropRow={onDrop}
              />
            ) : (
              <EmptyResult
                title={t("compliance.software.noRule")}
                description={t("compliance.software.canAddRule")}
              >
                <AddSoftwareRuleButton
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
    </>
  )
}
