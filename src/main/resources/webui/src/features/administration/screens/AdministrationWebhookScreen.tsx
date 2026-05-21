import api from "@/api"
import { DataTable, EmptyResult, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { usePagination } from "@/hooks"
import { Hook } from "@/types"
import { search } from "@/utils"
import {
  Button,
  Checkbox,
  Heading,
  IconButton,
  Skeleton,
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { LuSquarePen, LuPlus, LuTrash } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import AddWebhookButton from "../components/AddWebhookButton"
import EditWebhookButton from "../components/EditWebhookButton"
import RemoveWebhookButton from "../components/RemoveWebhookButton"
import { QUERIES } from "../constants"
import TableButtonStack from "../components/TableButtonStack"

const columnHelper = createColumnHelper<Hook>()

export default function AdministrationApiTokenScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.ADMIN_WEBHOOKS, pagination.query, pagination.offset, pagination.limit],
    queryFn: async () => api.admin.getAllHooks(pagination),
    select: useCallback(
      (res: Hook[]): Hook[] => {
        return search(res, "name").with(pagination.query)
      },
      [pagination.query]
    ),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.name"),
        enableSorting: true,
      }),
      columnHelper.accessor("enabled", {
        cell: (info) => {
          const enabled = info.getValue()
          return (
            <Checkbox.Root readOnly checked={enabled}>
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Root>
          )
        },
        header: t("common.enabled"),
        enableSorting: true,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("url", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.url"),
        enableSorting: true,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const webhook = info.row.original

          return (
            <TableButtonStack>
              <EditWebhookButton
                webhook={webhook}
                renderItem={(open) => (
                  <Tooltip content={t("common.edit")}>
                    <IconButton
                      aria-label={t("webhook.edit")}
                      variant="frame"
                      onClick={open}
                    >
                      <LuSquarePen />
                    </IconButton>
                  </Tooltip>
                )}
              />
              <RemoveWebhookButton
                webhook={webhook}
                renderItem={(open) => (
                  <Tooltip content={t("common.remove")}>
                    <IconButton
                      aria-label={t("webhook.remove")}
                      variant="frame"
                      onClick={open}
                    >
                      <LuTrash />
                    </IconButton>
                  </Tooltip>
                )}
              />
            </TableButtonStack>
          )
        },
        header: "",
        meta: {
          align: "right",
        },
      }),
    ],
    [t]
  )

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("webhook.list")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("common.searchPlaceholder")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddWebhookButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open}>
                <LuPlus />
                {t("common.create")}
              </Button>
            )}
          />
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
              <DataTable columns={columns} data={data} loading={isPending} />
            ) : (
              <EmptyResult
                title={t("webhook.none")}
                description={t("webhook.canCreate")}
              >
                <AddWebhookButton
                  renderItem={(open) => (
                    <Button variant="outline" onClick={open}>
                      <LuPlus />
                      {t("common.create")}
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
