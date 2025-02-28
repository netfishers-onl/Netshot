import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Search } from "@/components";
import { ANY_OPTION } from "@/constants";
import { usePagination, useToast } from "@/hooks";
import { CredentialSet } from "@/types";
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
import { useTranslation } from "react-i18next";
import AddDeviceCredentialButton from "../components/AddDeviceCredentialButton";
import EditDeviceCredentialButton from "../components/EditDeviceCredentialButton";
import RemoveDeviceCredentialButton from "../components/RemoveDeviceCredentialButton";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<CredentialSet>();

export default function AdministrationDeviceCredentialScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data = [], isLoading } = useQuery(
    [
      QUERIES.ADMIN_DEVICE_CREDENTIALS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.admin.getAllCredentialSet(pagination),
    {
      select(res) {
        return search(res, "name").with(pagination.query);
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
      columnHelper.accessor("type", {
        cell: (info) => info.getValue(),
        header: t("Protocol"),
      }),
      columnHelper.accessor("mgmtDomain.name", {
        cell: (info) => {
          const value = info.getValue();

          return value ? value : ANY_OPTION.label;
        },
        header: t("Domain"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => {
          const credential = info.row.original;

          return (
            <Stack direction="row" spacing="2" justifyContent="end">
              <EditDeviceCredentialButton
                credential={credential}
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
              <RemoveDeviceCredentialButton
                credential={credential}
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
          {t("Device credentials")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddDeviceCredentialButton
            renderItem={(open) => (
              <Button
                variant="primary"
                onClick={open}
                leftIcon={<Icon name="plus" />}
              >
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
                title={t("There is no device credential")}
                description={t(
                  "You can create a credential set to centralize authentication management for a device"
                )}
              >
                <AddDeviceCredentialButton
                  renderItem={(open) => (
                    <Button
                      variant="primary"
                      onClick={open}
                      leftIcon={<Icon name="plus" />}
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
