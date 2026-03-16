import api from "@/api"
import { DataTable, EmptyResult, Icon, Search } from "@/components"
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
import { Plus } from "react-feather"
import { useTranslation } from "react-i18next"
import { LuCloud, LuHardDrive } from "react-icons/lu"
import AddUserButton from "../components/AddUserButton"
import EditUserButton from "../components/EditUserButton"
import RemoveUserButton from "../components/RemoveUserButton"
import { QUERIES } from "../constants"

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
        header: t("Username"),
        enableSorting: true,
      }),
      columnHelper.accessor("local", {
        cell: (info) => {
          const value = info.getValue()

          return (
            <Badge size="lg" variant="outline">
              {value ? <LuHardDrive /> : <LuCloud />}
              {t(value ? "Local" : "Remote")}
            </Badge>
          )
        },
        header: t("Type"),
        minSize: 90,
      }),
      columnHelper.accessor("level", {
        cell: (info) => {
          const value = info.getValue()
          const label = userLevelOptions.getLabelByValue(value)

          return <Text>{label ? label : t("Unknown")}</Text>
        },
        header: t("Permission level"),
        enableSorting: true,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const user = info.row.original
          const isCurrentUser = user.username === currentUser.username

          if (isCurrentUser) {
            return <Box w="40px" h="40px" />
          }

          return (
            <Stack direction="row" gap="0" justifyContent="end">
              <EditUserButton
                user={user}
                renderItem={(open) => (
                  <Tooltip content={t("Edit")}>
                    <IconButton
                      aria-label={t("Edit user")}
                      variant="ghost"
                      colorPalette="green"
                      onClick={open}
                    >
                      <Icon name="edit" />
                    </IconButton>
                  </Tooltip>
                )}
              />
              <RemoveUserButton
                user={user}
                renderItem={(open) => (
                  <Tooltip content={t("Remove")}>
                    <IconButton
                      aria-label={t("Remove user")}
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
      }),
    ],
    [t]
  )

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Users")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddUserButton
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
                title={t("There is no user")}
                description={t("You can create users with different roles to manage Netshot")}
              >
                <AddUserButton
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
