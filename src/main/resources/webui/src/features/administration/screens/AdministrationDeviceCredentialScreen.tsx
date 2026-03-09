import api from "@/api"
import { DataTable, EmptyResult, Icon, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { usePagination } from "@/hooks"
import { CredentialSet } from "@/types"
import { getAnyOption, search } from "@/utils"
import { Button, Heading, IconButton, Skeleton, Spacer, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import AddDeviceCredentialButton from "../components/AddDeviceCredentialButton"
import EditDeviceCredentialButton from "../components/EditDeviceCredentialButton"
import RemoveDeviceCredentialButton from "../components/RemoveDeviceCredentialButton"
import { QUERIES } from "../constants"

const columnHelper = createColumnHelper<CredentialSet>()

export default function AdministrationDeviceCredentialScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()
  const anyOption = getAnyOption(t)

  const { data = [], isPending } = useQuery({
    queryKey: [
      QUERIES.ADMIN_DEVICE_CREDENTIALS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    queryFn: async () => api.admin.getAllCredentialSets(pagination),
    select: useCallback(
      (res: CredentialSet[]): CredentialSet[] => {
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
        size: 20000,
      }),
      columnHelper.accessor("type", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Protocol"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("mgmtDomain", {
        cell: (info) => {
          const value = info.getValue()
          return <Text>{value ? value.name : anyOption.label}</Text>
        },
        header: t("Domain"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const credential = info.row.original

          return (
            <Stack direction="row" gap="0" justifyContent="end">
              <EditDeviceCredentialButton
                credential={credential}
                renderItem={(open) => (
                  <Tooltip content={t("Edit")}>
                    <IconButton
                      aria-label={t("Edit domain")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <Icon name="edit" />
                    </IconButton>
                  </Tooltip>
                )}
              />
              <RemoveDeviceCredentialButton
                credential={credential}
                renderItem={(open) => (
                  <Tooltip content={t("Remove")}>
                    <IconButton
                      aria-label={t("Remove domain")}
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
          {t("Device credentials")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddDeviceCredentialButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open}>
                <Icon name="plus" />
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
                title={t("There is no device credential")}
                description={t(
                  "You can create a credential set to centralize authentication management for a device"
                )}
              >
                <AddDeviceCredentialButton
                  renderItem={(open) => (
                    <Button variant="primary" onClick={open}>
                      <Icon name="plus" />
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
