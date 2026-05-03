import api from "@/api"
import { DataTable, EmptyResult, Search } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts"
import { usePagination, useUserLevelOptions } from "@/hooks"
import { User } from "@/types"
import { search } from "@/utils"
import {
  Badge,
  Box,
  Button,
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
import { FiCloud, FiDatabase, FiEdit, FiPlus, FiTrash } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import AddUserButton from "../components/AddUserButton"
import EditUserButton from "../components/EditUserButton"
import RemoveUserButton from "../components/RemoveUserButton"
import { QUERIES } from "../constants"
import TableButtonStack from "../components/TableButtonStack"

const columnHelper = createColumnHelper<User>()

export default function AdministrationUserScreen() {
  const { t } = useTranslation()
  const pagination = usePagination()
  const { user: currentUser } = useAuth()
  const userLevelOptions = useUserLevelOptions()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.ADMIN_USERS, pagination.query, pagination.offset, pagination.limit],
    queryFn: async () => api.admin.getAllUsers(pagination),
    select: useCallback(
      (res: User[]): User[] => {
        return search(res, "username").with(pagination.query)
      },
      [pagination.query]
    ),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("username", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("user.username"),
        enableSorting: true,
      }),
      columnHelper.accessor("local", {
        cell: (info) => {
          const value = info.getValue()

          return (
            <Badge size="lg" variant="outline" marginTop="-3px" marginBottom="-3px">
              {value ? <FiDatabase /> : <FiCloud />}
              {t(value ? "user.localType" : "user.remoteType")}
            </Badge>
          )
        },
        header: t("common.type"),
        minSize: 90,
      }),
      columnHelper.accessor("level", {
        cell: (info) => {
          const value = info.getValue()
          const label = userLevelOptions.getLabelByValue(value)

          return <Text>{label ? label : t("common.unknownLabel")}</Text>
        },
        header: t("user.permissionLevel"),
        enableSorting: true,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const user = info.row.original
          const isCurrentUser = user.username === currentUser.username

          if (isCurrentUser) {
            return <TableButtonStack />
          }

          return (
            <TableButtonStack>
              <EditUserButton
                user={user}
                renderItem={(open) => (
                  <Tooltip content={t("common.edit")}>
                    <IconButton
                      aria-label={t("user.edit")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <FiEdit />
                    </IconButton>
                  </Tooltip>
                )}
              />
              <RemoveUserButton
                user={user}
                renderItem={(open) => (
                  <Tooltip content={t("common.remove")}>
                    <IconButton
                      aria-label={t("user.remove")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <FiTrash />
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
      }),
    ],
    [t]
  )

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("user.list")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("common.searchPlaceholder")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddUserButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open}>
                <FiPlus />
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
                title={t("user.none")}
                description={t("user.canCreate")}
              >
                <AddUserButton
                  renderItem={(open) => (
                    <Button variant="outline" onClick={open}>
                      <FiPlus />
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
