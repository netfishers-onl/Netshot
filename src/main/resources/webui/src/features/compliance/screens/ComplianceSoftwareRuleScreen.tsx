import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DataTable, EmptyResult, Icon, Protected, Search } from "@/components"
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
import { useTranslation } from "react-i18next"
import AddSoftwareRuleButton from "../components/AddSoftwareRuleButton"
import EditSoftwareRuleButton from "../components/EditSoftwareRuleButton"
import RemoveSoftwareRuleButton from "../components/RemoveSoftwareRuleButton"
import { QUERIES } from "../constants"

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
      cell: (info) => <Text>{info.getValue()?.name || t("any")}</Text>,
      header: t("group"),
      size: 10000,
    }),
    columnHelper.accessor("deviceType", {
      cell: (info) => <Text>{info.getValue() || t("any")}</Text>,
      header: t("device2"),
      size: 10000,
    }),
    columnHelper.accessor("family", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("deviceFamily"),
      size: 10000,
    }),
    columnHelper.accessor("partNumber", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("partNumber"),
      size: 10000,
    }),
    columnHelper.accessor("version", {
      cell: (info) => <Text>{info.getValue()}</Text>,
      header: t("version"),
      size: 10000,
    }),
    columnHelper.accessor("level", {
      cell: (info) => {
        const level = info.getValue()

        return <Tag.Root colorPalette={getSoftwareLevelColor(level)}>{level}</Tag.Root>
      },
      header: t("level"),
      size: 10000,
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => {
        const rule = info.row.original

        return (
          <Protected minLevel={Level.ReadWrite}>
            <Stack direction="row" gap="2">
              <EditSoftwareRuleButton
                rule={rule}
                renderItem={(open) => (
                  <Tooltip content={t("edit")}>
                    <IconButton
                      variant="ghost"
                      colorPalette="green"
                      aria-label={t("editTheRule")}
                      onClick={open}
                    >
                      <Icon name="edit" />
                    </IconButton>
                  </Tooltip>
                )}
              />

              <RemoveSoftwareRuleButton
                rule={rule}
                renderItem={(open) => (
                  <Tooltip content={t("remove2")}>
                    <IconButton
                      variant="ghost"
                      colorPalette="green"
                      aria-label={t("removeTheRule")}
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
      title: t("changePriority"),
      description: t("areYouSureToChangeRulesPriorities"),
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
          {t("softwareVersionCompliance")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("search2")}
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
                    <Icon name="plus" />
                    {t("addRule")}
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
                title={t("thereIsNoSoftwareRule")}
                description={t("youCanAddARuleToCheckDeviceSoftwareCompliance")}
              >
                <AddSoftwareRuleButton
                  renderItem={(open) => (
                    <Button onClick={open} variant="primary">
                      <Icon name="plus" />
                      {t("addRule")}
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
