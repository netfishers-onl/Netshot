import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Search } from "@/components";
import { getUserLevelLabel } from "@/constants";
import { usePagination, useToast } from "@/hooks";
import { User } from "@/types";
import { search } from "@/utils";
import {
  Button,
  Heading,
  IconButton,
  Skeleton,
  Spacer,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { Plus } from "react-feather";
import { useTranslation } from "react-i18next";
import AddUserButton from "../components/AddUserButton";
import EditUserButton from "../components/EditUserButton";
import RemoveUserButton from "../components/RemoveUserButton";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<User>();

export default function AdministrationUserScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data = [], isLoading } = useQuery(
    [
      QUERIES.ADMIN_USERS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.admin.getAllUser(pagination),
    {
      select(res) {
        return search(res, "username").with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("username", {
        cell: (info) => info.getValue(),
        header: t("Username"),
      }),
      columnHelper.accessor("level", {
        cell: (info) => {
          const value = info.getValue();
          const label = getUserLevelLabel(value);

          return label ? label : t("Unknown");
        },
        header: t("Permission level"),
      }),
      columnHelper.accessor("local", {
        cell: (info) => (info.getValue() ? t("Yes") : t("No")),
        header: t("Local authentication"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => {
          const user = info.row.original;

          return (
            <Stack direction="row" spacing="2" justifyContent="end">
              <EditUserButton
                user={user}
                renderItem={(open) => (
                  <Tooltip label={t("Edit")}>
                    <IconButton
                      aria-label={t("Edit user")}
                      icon={<Icon name="edit" />}
                      variant="ghost"
                      colorScheme="green"
                      onClick={open}
                    />
                  </Tooltip>
                )}
              />
              <RemoveUserButton
                user={user}
                renderItem={(open) => (
                  <Tooltip label={t("Remove")}>
                    <IconButton
                      aria-label={t("Remove user")}
                      icon={<Icon name="trash" />}
                      variant="ghost"
                      colorScheme="green"
                      onClick={open}
                    />
                  </Tooltip>
                )}
              />
            </Stack>
          );
        },
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
      }),
    ],
    [t]
  );

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Users")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddUserButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open} leftIcon={<Plus />}>
                {t("Create")}
              </Button>
            )}
          />
        </Stack>
        {isLoading ? (
          <Stack spacing="3">
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
          </Stack>
        ) : (
          <>
            {data?.length > 0 ? (
              <DataTable columns={columns} data={data} loading={isLoading} />
            ) : (
              <EmptyResult
                title={t("There is no user")}
                description={t(
                  "You can create user with different role to manage netshot"
                )}
              >
                <AddUserButton
                  renderItem={(open) => (
                    <Button
                      variant="primary"
                      onClick={open}
                      leftIcon={<Plus />}
                    >
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
  );
}
