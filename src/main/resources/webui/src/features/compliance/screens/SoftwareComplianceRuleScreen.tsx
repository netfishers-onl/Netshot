import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DataTable, EmptyResult, Protected, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { MUTATIONS } from "@/constants"
import { useAuth } from "@/contexts"
import { useConfirmDialogWithMutation } from "@/dialog"
import { usePagination, useSoftwareLevels, useToast } from "@/hooks"
import { Level, SoftwareRule } from "@/types"
import { getNextItemInArray, search } from "@/utils"
import { Badge, Button, Heading, Icon, IconButton, Skeleton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createColumnHelper, Row } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { LuSquarePen, LuPlus, LuTrash, LuAsterisk, LuTrophy, LuArrowRight, LuMoveRight, LuChevronRight, LuChevronsRight, LuArrowBigRightDash } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import AddSoftwareRuleButton from "../components/AddSoftwareRuleButton"
import EditSoftwareRuleButton from "../components/EditSoftwareRuleButton"
import RemoveSoftwareRuleButton from "../components/RemoveSoftwareRuleButton"
import { QUERIES } from "../constants"
import TableButtonStack from "@/features/administration/components/TableButtonStack"

const columnHelper = createColumnHelper<SoftwareRule>()

export default function SoftwareComplianceRuleScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()
  const { user } = useAuth()
  const [data, setData] = useState<SoftwareRule[]>([])
  const [reorderPending, setReorderPending] = useState(false)
  const dialog = useConfirmDialogWithMutation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { getColor } = useSoftwareLevels()

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
    if (isSuccess && !reorderPending) {
      setData(rules)
    }
  }, [isSuccess, rules, reorderPending])

  const isDraggable = (user?.level || 0) >= Level.ReadWrite

  const columns = [
    columnHelper.accessor("targetGroup", {
      cell: (info) => {
        const value = info.getValue()
        if (!value) {
          return (
            <Badge size="lg" variant="outline" marginTop="-3px" marginBottom="-3px">
              <LuAsterisk />
              {t("common.any")}
            </Badge>
          )
        }
        return <Text>{value.name}</Text>
      },
      header: t("group.label"),
      size: 10000,
    }),
    columnHelper.accessor("deviceType", {
      cell: (info) => {
        const value = info.getValue()
        if (!value) {
          return (
            <Badge size="lg" variant="outline" marginTop="-3px" marginBottom="-3px">
              <LuAsterisk />
              {t("common.any")}
            </Badge>
          )
        }
        return <Text>{value}</Text>
      },
      header: t("device.type"),
      size: 10000,
    }),
    columnHelper.accessor("family", {
      cell: (info) => {
        const value = info.getValue()
        if (!value) {
          return (
            <Badge size="lg" variant="outline" marginTop="-3px" marginBottom="-3px">
              <LuAsterisk />
              {t("common.any")}
            </Badge>
          )
        }
        return <Text>{value}</Text>
      },
      header: t("device.family"),
      size: 10000,
    }),
    columnHelper.accessor("partNumber", {
      cell: (info) => {
        const value = info.getValue()
        if (!value) {
          return (
            <Badge size="lg" variant="outline" marginTop="-3px" marginBottom="-3px">
              <LuAsterisk />
              {t("common.any")}
            </Badge>
          )
        }
        return <Text>{value}</Text>
      },
      header: t("device.module.partNumber"),
      size: 10000,
    }),
    columnHelper.accessor("version", {
      cell: (info) => {
        const value = info.getValue()
        if (!value) {
          return (
            <Badge size="lg" variant="outline" marginTop="-3px" marginBottom="-3px">
              <LuAsterisk />
              {t("common.any")}
            </Badge>
          )
        }
        return <Text>{value}</Text>
      },
      header: t("common.version"),
      size: 10000,
    }),
    columnHelper.display({
      id: "arrow",
      cell: () => <Icon><LuMoveRight /></Icon>,
      header: "",
      enableSorting: false,
      size: 30,
      minSize: 30,
      meta: {
        align: "center",
      },
    }),
    columnHelper.accessor("level", {
      cell: (info) => {
        const level = info.getValue()

        return (
          <Badge colorPalette={getColor(level)}>
            <LuTrophy size={12} />
            {level}
          </Badge>
        )
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
                      variant="frame"
                      aria-label={t("policy.rule.editThe")}
                      onClick={open}
                    >
                      <LuSquarePen />
                    </IconButton>
                  </Tooltip>
                )}
              />

              <RemoveSoftwareRuleButton
                rule={rule}
                renderItem={(open) => (
                  <Tooltip content={t("common.remove")}>
                    <IconButton
                      variant="frame"
                      aria-label={t("policy.rule.removeThe")}
                      onClick={open}
                    >
                      <LuTrash />
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

  function onDrop(row: Row<SoftwareRule>, reorderedData: SoftwareRule[]) {
    const id = row.original.id
    const nextItem = getNextItemInArray(row.original, reorderedData, "id")
    const originalData = [...data]

    setReorderPending(true)

    const dialogRef = dialog.open(MUTATIONS.SOFTWARE_RULE_REORDER, {
      title: t("common.changePriority"),
      description: t("policy.rule.confirmChangePriorities"),
      async onConfirm() {
        await reorderMutation.mutateAsync({ id: id, nextId: nextItem?.id })

        setData(reorderedData)
        dialogRef.close()

        await queryClient.invalidateQueries({ queryKey: [QUERIES.SOFTWARE_RULE_LIST] })

        setReorderPending(false)
      },
      onCancel() {
        setReorderPending(false)
        setData(originalData)
      },
    })
  }

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("compliance.software.versionLabel")}
        </Heading>
        <Text color="fg.muted">{t("compliance.software.howItWorks")}</Text>
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
                    <LuPlus />
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
                      <LuPlus />
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
