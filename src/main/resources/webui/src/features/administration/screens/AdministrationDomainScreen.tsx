import api from "@/api"
import { DataTable, EmptyResult, Icon, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { usePagination } from "@/hooks"
import { Domain } from "@/types"
import { search } from "@/utils"
import { Button, Heading, IconButton, Skeleton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { Plus } from "react-feather"
import { useTranslation } from "react-i18next"
import AddDomainButton from "../components/AddDomainButton"
import EditDomainButton from "../components/EditDomainButton"
import RemoveDomainButton from "../components/RemoveDomainButton"
import { QUERIES } from "../constants"
import TableButtonStack from "../components/TableButtonStack"

const columnHelper = createColumnHelper<Domain>()

export default function AdministrationDomainScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.ADMIN_DEVICE_DOMAINS, pagination.query, pagination.offset, pagination.limit],
    queryFn: async () => api.admin.getAllDomains(pagination),
    select: useCallback(
      (res: Domain[]): Domain[] => {
        return search(res, "name", "description", "ipAddress").with(pagination.query)
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
        size: 10000,
      }),
      columnHelper.accessor("description", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("description"),
        enableSorting: true,
        size: 20000,
      }),
      columnHelper.accessor("ipAddress", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("serverAddress"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const domain = info.row.original

          return (
            <TableButtonStack>
              <EditDomainButton
                domain={domain}
                renderItem={(open) => (
                  <Tooltip content={t("edit")}>
                    <IconButton
                      aria-label={t("editDomain")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <Icon name="edit" />
                    </IconButton>
                  </Tooltip>
                )}
              />
              <RemoveDomainButton
                domain={domain}
                renderItem={(open) => (
                  <Tooltip content={t("remove")}>
                    <IconButton
                      aria-label={t("removeDomain")}
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
        enableSorting: false,
        meta: {
          align: "right",
        },
        minSize: 80,
        size: 200,
      }),
    ],
    [t]
  )

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("deviceDomains")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("searchPlaceholder")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddDomainButton
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
                title={t("thereIsNoDomain")}
                description={t("youShouldCreateAtLeastOneDomainBeforeAddingDevices")}
              >
                <AddDomainButton
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
