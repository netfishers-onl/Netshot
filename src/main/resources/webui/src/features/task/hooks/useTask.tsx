import api, { TaskQueryParams } from "@/api";
import { NetshotError } from "@/api/httpClient";
import TaskStatusTag from "@/components/TaskStatusTag";
import { QUERIES } from "@/constants";
import { usePagination, useToast } from "@/hooks";
import { Task, TaskStatus } from "@/types";
import { formatDate } from "@/utils";
import { Button, Text, useDisclosure } from "@chakra-ui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { endOfDay, startOfDay } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export type FilterForm = {
  executionDate: string;
};

const columnHelper = createColumnHelper<Task>();

export function useTask(status?: TaskStatus) {
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();

  const pagination = usePagination({
    limit: 50,
  });
  const [taskId, setTaskId] = useState<number>(null);
  const [filters, setFilters] = useState<{
    before: number;
    after: number;
  }>({
    before: null,
    after: null,
  });

  const form = useForm<FilterForm>({
    defaultValues: {
      executionDate: "",
    },
  });

  const {
    data,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      QUERIES.TASK,
      status ? status : "all",
      pagination.query,
      filters.before,
      filters.after,
    ],
    queryFn: async ({ pageParam }) => {
      let params = {
        offset: pageParam,
        limit: pagination.limit,
      } as TaskQueryParams;

      if (status) {
        params.status = status;
      }

      if (filters.before && filters.after) {
        params = {
          ...params,
          before: filters.before,
          after: filters.after,
        };
      }

      return api.task.getAll(params);
    },
    initialPageParam: 0,
    getNextPageParam(lastPage, allPages) {
      return lastPage?.length === pagination.limit
        ? allPages.length * pagination.limit
        : undefined;
    },
  });

  const applyFilter = useCallback((values: FilterForm) => {
    setFilters({
      before: endOfDay(new Date(values.executionDate)).getTime(),
      after: startOfDay(new Date(values.executionDate)).getTime(),
    });
  }, []);

  const clearFilter = useCallback(() => {
    setFilters({
      before: null,
      after: null,
    });

    form.setValue("executionDate", "");
  }, []);

  const openTask = useCallback((id: number) => {
    setTaskId(id);
    disclosure.onOpen();
  }, []);

  const onClose = useCallback(() => {
    setTaskId(null);
    disclosure.onClose();
  }, []);

  const onBottomReached = useCallback(() => {
    if (isFetchingNextPage) {
      return;
    }

    if (!hasNextPage) {
      return;
    }

    fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("taskDescription", {
        cell: (info) => info.getValue(),
        header: t("Type"),
      }),
      columnHelper.accessor("target", {
        cell: (info) => {
          if (!info.row.original.deviceId) {
            return info.getValue();
          }

          return (
            <Text
              as={Link}
              to={`/app/devices/${info.row.original.deviceId}/tasks`}
              textDecoration="underline"
            >
              {info.getValue()}
            </Text>
          );
        },
        header: t("Target"),
      }),
      columnHelper.accessor("author", {
        cell: (info) => info.getValue(),
        header: t("Creator"),
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
    [t]
  );

  const flatData = useMemo(
    () => data?.pages?.flatMap((page) => page) ?? [],
    [data]
  );

  return {
    data: flatData,
    isLoading: isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    pagination,
    onBottomReached,
    disclosure,
    taskId,
    onClose,
    applyFilter,
    clearFilter,
    form,
    columns,
  };
}
