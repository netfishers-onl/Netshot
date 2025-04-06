import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { Hook } from "@/types";
import { search } from "@/utils";
import {
  Button,
  Checkbox,
  Heading,
  IconButton,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { Plus } from "react-feather";
import { useTranslation } from "react-i18next";
import AddWebhookButton from "../components/AddWebhookButton";
import EditWebhookButton from "../components/EditWebhookButton";
import RemoveWebhookButton from "../components/RemoveWebhookButton";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<Hook>();

export default function AdministrationApiTokenScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();

  const { data = [], isPending } = useQuery({
    queryKey: [
      QUERIES.ADMIN_WEBHOOKS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    queryFn: async () => api.admin.getAllHooks(pagination),
    select: useCallback((res: Hook[]): Hook[] => {
      return search(res, "name").with(pagination.query);
    }, [pagination.query]),
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => info.getValue(),
        header: t("Name"),
        enableSorting: true,
        size: 10000,
      }),
      columnHelper.accessor("enabled", {
        cell: (info) => {
          const enabled = info.getValue();
          return (
            <Checkbox readOnly isChecked={enabled} />
          );
        },
        header: t("Enabled"),
        enableSorting: true,
        size: 100,
        minSize: 100,
        meta: {
          align: "center",
        },
      }),
      columnHelper.accessor("url", {
        cell: (info) => info.getValue(),
        header: t("URL"),
        enableSorting: true,
        size: 20000,
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const webhook = info.row.original;

          return (
            <Stack direction="row" spacing="0" justifyContent="end">
              <EditWebhookButton
                webhook={webhook}
                renderItem={(open) => (
                  <Tooltip label={t("Edit")}>
                    <IconButton
                      aria-label={t("Edit webhook")}
                      icon={<Icon name="edit" />}
                      variant="ghost"
                      colorScheme="green"
                      onClick={open}
                    />
                  </Tooltip>
                )}
              />
              <RemoveWebhookButton
                webhook={webhook}
                renderItem={(open) => (
                  <Tooltip label={t("Remove")}>
                    <IconButton
                      aria-label={t("Remove webhook")}
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
        meta: {
          align: "right",
        },
        minSize: 80,
        size: 200,
      }),
    ],
    [t]
  );

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Webhooks")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <AddWebhookButton
            renderItem={(open) => (
              <Button variant="primary" onClick={open} leftIcon={<Plus />}>
                {t("Create")}
              </Button>
            )}
          />
        </Stack>
        {isPending ? (
          <Stack spacing="3">
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
                  "You can create webhook to launch external code linked to Netshot event"
                )}
              >
                <AddWebhookButton
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
