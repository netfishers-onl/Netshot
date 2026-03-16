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
        header: t("Name"),
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
        header: t("Enabled"),
        enableSorting: true,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("url", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("URL"),
        enableSorting: true,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const webhook = info.row.original

          return (
            <Stack direction="row" gap="0" justifyContent="end">
              <EditWebhookButton
                webhook={webhook}
                renderItem={(open) => (
                  <Tooltip content={t("Edit")}>
                    <IconButton
                      aria-label={t("Edit webhook")}
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
                  <Tooltip content={t("Remove")}>
                    <IconButton
                      aria-label={t("Remove webhook")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <Icon name="trash" />
                    </IconButton>
                  </Tooltip>
                )}
              />
            </Stack>
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
          {t("Webhooks")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddWebhookButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open}>
                <Plus />
                {t("Create")}
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
                title={t("There is no webhook")}
                description={t(
                  "You can create a webhook to launch external code linked to Netshot event"
                )}
              >
                <AddWebhookButton
                  renderItem={(open) => (
                    <Button variant="primary" onClick={open}>
                      <Plus />
                      {t("Create")}
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
