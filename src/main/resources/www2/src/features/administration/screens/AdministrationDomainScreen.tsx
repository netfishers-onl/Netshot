import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { Domain } from "@/types";
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
import AddDomainButton from "../components/AddDomainButton";
import EditDomainButton from "../components/EditDomainButton";
import RemoveDomainButton from "../components/RemoveDomainButton";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<Domain>();

export default function AdministrationDomainScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data = [], isLoading } = useQuery(
    [
      QUERIES.ADMIN_DEVICE_DOMAINS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.admin.getAllDomain(pagination),
    {
      select(res) {
        return search(res, "name", "description", "ipAddress").with(
          pagination.query
        );
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => info.getValue(),
        header: t("Name"),
      }),
      columnHelper.accessor("description", {
        cell: (info) => info.getValue(),
        header: t("Description"),
      }),
      columnHelper.accessor("ipAddress", {
        cell: (info) => info.getValue(),
        header: t("Server address"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => {
          const domain = info.row.original;

          return (
            <Stack direction="row" spacing="2" justifyContent="end">
              <EditDomainButton
                domain={domain}
                renderItem={(open) => (
                  <Tooltip label={t("Edit")}>
                    <IconButton
                      aria-label={t("Edit domain")}
                      icon={<Icon name="edit" />}
                      variant="ghost"
                      colorScheme="green"
                      onClick={open}
                    />
                  </Tooltip>
                )}
              />
              <RemoveDomainButton
                domain={domain}
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
          {t("Device domains")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddDomainButton
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
                title={t("There is no domain")}
                description={t("You can create domain for multiple device")}
              >
                <AddDomainButton
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
