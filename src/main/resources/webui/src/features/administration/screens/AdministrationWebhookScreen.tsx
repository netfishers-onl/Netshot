import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Search } from "@/components";
import { usePagination, useToast } from "@/hooks";
import { Hook } from "@/types";
import { search } from "@/utils";
import {
  Button,
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
import { useMemo } from "react";
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

  const { data = [], isLoading } = useQuery(
    [
      QUERIES.ADMIN_WEBHOOKS,
      pagination.query,
      pagination.offset,
      pagination.limit,
    ],
    async () => api.admin.getAllHook(pagination),
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
      columnHelper.accessor("enabled", {
        cell: (info) => {
          const enabled = info.getValue();

          return (
            <Tag colorScheme={enabled ? "green" : "red"}>
              {t(enabled ? "Enabled" : "Disabled")}
            </Tag>
          );
        },
        header: t("Enabled"),
      }),
      columnHelper.accessor("url", {
        cell: (info) => info.getValue(),
        header: t("URL"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => {
          const webhook = info.row.original;

          return (
            <Stack direction="row" spacing="2" justifyContent="end">
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
