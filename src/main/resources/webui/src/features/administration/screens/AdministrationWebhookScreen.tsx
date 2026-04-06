import api from "@/api"
import { DataTable, EmptyResult, Icon, Search } from "@/components"
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
import { Plus } from "react-feather"
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
        header: t("name"),
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
        header: t("enabled"),
        enableSorting: true,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("url", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("url"),
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
                  <Tooltip content={t("edit")}>
                    <IconButton
                      aria-label={t("editWebhook")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <Icon name="edit" />
                    </IconButton>
                  </Tooltip>
                )}
              />
              <RemoveWebhookButton
                webhook={webhook}
                renderItem={(open) => (
                  <Tooltip content={t("remove")}>
                    <IconButton
                      aria-label={t("removeWebhook")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <Icon name="trash" />
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
          {t("webhooks")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("search2")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddWebhookButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open}>
                <Plus />
                {t("create")}
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
                title={t("thereIsNoWebhook")}
                description={t(
                  "youCanCreateAWebhookToLaunchExternalCodeLinkedToNetshotEvent"
                )}
              >
                <AddWebhookButton
                  renderItem={(open) => (
                    <Button variant="outline" onClick={open}>
                      <Plus />
                      {t("create")}
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
