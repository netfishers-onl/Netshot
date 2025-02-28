import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult } from "@/components";
import TaskDialog from "@/components/TaskDialog";
import TaskStatusTag from "@/components/TaskStatusTag";
import { usePagination, useToast } from "@/hooks";
import { Task } from "@/types";
import { formatDate } from "@/utils";
import { Button, Skeleton, Stack, useDisclosure } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<Task>();

/**
 * @todo: Add pagination (paginator)
 */
export default function DeviceTaskScreen() {
  const params = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();
  const pagination = usePagination({
    limit: 20,
  });
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);

  const { data = [], isLoading } = useQuery(
    [QUERIES.DEVICE_MODULES, params.id, pagination.limit],
    async () =>
      api.device.getAllTaskById(+params.id, {
        limit: pagination.limit,
      }),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const openTask = useCallback((id: number) => {
    setTaskId(id);
    disclosure.onOpen();
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("taskDescription", {
        cell: (info) => info.getValue(),
        header: t("Type"),
      }),
      columnHelper.accessor("status", {
        cell: (info) => <TaskStatusTag status={info.getValue()} />,
        header: t("Status"),
      }),
      columnHelper.accessor("executionDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("Execution time"),
      }),
      columnHelper.accessor("comments", {
        cell: (info) => info.getValue(),
        header: t("Comments"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => (
          <Button
            variant="ghost"
            colorScheme="green"
            onClick={() => openTask(info.getValue())}
          >
            {t("See details")}
          </Button>
        ),
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
      }),
    ],
    [t, openTask]
  );

  const onClose = useCallback(() => {
    setTaskId(null);
    disclosure.onClose();
  }, []);

  return (
    <>
      <Stack spacing="6" flex="1" overflow="auto">
        {/* <Search
          placeholder={t("Search...")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="25%"
        /> */}
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
                title={t("There is no task")}
                description={t("This device does not have any task")}
              />
            )}
          </>
        )}
      </Stack>
      <TaskDialog id={taskId} {...disclosure} onClose={onClose} />
    </>
  );
}
