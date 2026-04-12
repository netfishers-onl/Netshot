import api from "@/api"
import { DataTable, EmptyResult, Icon, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { usePagination } from "@/hooks"
import { ApiToken } from "@/types"
import { search } from "@/utils"
import { Button, Heading, IconButton, Skeleton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { Plus } from "react-feather"
import { useTranslation } from "react-i18next"
import AddApiTokenButton from "../components/AddApiTokenButton"
import RemoveApiTokenButton from "../components/RemoveApiTokenButton"
import { QUERIES } from "../constants"
import { useApiTokenLevelOptions } from "../hooks"
import TableButtonStack from "../components/TableButtonStack"

const columnHelper = createColumnHelper<ApiToken>()

export default function AdministrationApiTokenScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()
  const apiTokenLevelOptions = useApiTokenLevelOptions()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.ADMIN_API_TOKENS, pagination.query, pagination.offset, pagination.limit],
    queryFn: async () => api.admin.getAllApiTokens(pagination),
    select: useCallback(
      (res: ApiToken[]): ApiToken[] => {
        return search(res, "description").with(pagination.query)
      },
      [pagination.query]
    ),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("description", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("description"),
        enableSorting: true,
        size: 20000,
      }),
      columnHelper.accessor("level", {
        cell: (info) => <Text>{apiTokenLevelOptions.getByValue(info.getValue())?.label}</Text>,
        header: t("permissionLevel"),
        enableSorting: true,
        size: 10000,
        minSize: 200,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const apiToken = info.row.original

          return (
            <TableButtonStack>
              <RemoveApiTokenButton
                apiToken={apiToken}
                renderItem={(open) => (
                  <Tooltip content={t("remove")}>
                    <IconButton
                      aria-label={t("removeToken")}
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
        size: 100,
        minSize: 50,
      }),
    ],
    [t]
  )

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("apiTokens")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("searchPlaceholder")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddApiTokenButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open}>
                <Icon name="plus" />
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
                title={t("thereIsNoApiToken")}
                description={t("youCanCreateTokensToUseNetshotEmbeddedRestApi")}
              >
                <AddApiTokenButton
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
