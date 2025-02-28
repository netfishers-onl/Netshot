import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { ApiToken } from "@/types";
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
import AddApiTokenButton from "../components/AddApiTokenButton";
import RemoveApiTokenButton from "../components/RemoveApiTokenButton";
import { QUERIES, getApiTokenLevelLabel } from "../constants";

const columnHelper = createColumnHelper<ApiToken>();

export default function AdministrationApiTokenScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data = [], isLoading } = useQuery(
    [
      QUERIES.ADMIN_API_TOKENS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.admin.getAllApiToken(pagination),
    {
      select(res) {
        return search(res, "description").with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("description", {
        cell: (info) => info.getValue(),
        header: t("Description"),
      }),
      columnHelper.accessor("level", {
        cell: (info) => getApiTokenLevelLabel(info.getValue()),
        header: t("Permission level"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => {
          const apiToken = info.row.original;

          return (
            <Stack direction="row" spacing="2" justifyContent="end">
              <RemoveApiTokenButton
                apiToken={apiToken}
                renderItem={(open) => (
                  <Tooltip label={t("Remove")}>
                    <IconButton
                      aria-label={t("Remove domain")}
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
          {t("API tokens")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddApiTokenButton
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
                title={t("There is no api token")}
                description={t(
                  "You can create API token to communicate with Netshot"
                )}
              >
                <AddApiTokenButton
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
