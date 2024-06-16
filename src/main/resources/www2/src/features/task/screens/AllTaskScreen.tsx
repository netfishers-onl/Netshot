import api, { TaskQueryParams } from "@/api";
import { NetshotError } from "@/api/httpClient";
import {
  DataTable,
  EmptyResult,
  FormControl,
  Icon,
  Search,
} from "@/components";
import { FormControlType } from "@/components/FormControl";
import TaskDialog from "@/components/TaskDialog";
import TaskStatusTag from "@/components/TaskStatusTag";
import { usePagination, useToast } from "@/hooks";
import { Task } from "@/types";
import { formatDate, search } from "@/utils";
import {
  Button,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Skeleton,
  Spacer,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { endOfDay, startOfDay } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

type FilterForm = {
  executionDate: string;
};

const columnHelper = createColumnHelper<Task>();

export default function AllTaskScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);
  const [filters, setFilters] = useState<{
    before: number;
    after: number;
  }>({
    before: endOfDay(new Date()).getTime(),
    after: startOfDay(new Date()).getTime(),
  });

  const form = useForm<FilterForm>({
    defaultValues: {
      executionDate: new Date().toISOString().substring(0, 10),
    },
  });

  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery(
    [
      QUERIES.TASK_ALL,
      pagination.query,
      pagination.offset,
      pagination.limit,
      filters.before,
      filters.after,
    ],
    async () => {
      let params = {
        offset: pagination.offset,
        limit: pagination.limit,
      } as TaskQueryParams;

      if (filters.before && filters.after) {
        params = {
          ...params,
          before: filters.before,
          after: filters.after,
        };
      }

      return api.task.getAll(params);
    },
    {
      select(res) {
        return search(
          res,
          "taskDescription",
          "author",
          "status",
          "target"
        ).with(pagination.query);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

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

  const columns = useMemo(
    () => [
      columnHelper.accessor("taskDescription", {
        cell: (info) => info.getValue(),
        header: t("Type"),
      }),
      columnHelper.accessor("target", {
        cell: (info) => info.getValue(),
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

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("All tasks")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <Menu>
            <MenuButton
              as={Button}
              variant="primary"
              leftIcon={<Icon name="filter" />}
            >
              {t("Filters")}
            </MenuButton>
            <MenuList minWidth="280px">
              <Stack
                spacing="6"
                p="3"
                as="form"
                onSubmit={form.handleSubmit(applyFilter)}
              >
                <FormControl
                  control={form.control}
                  name="executionDate"
                  type={FormControlType.Date}
                  label={t("Execution date")}
                />
                <Stack spacing="2">
                  <Button variant="primary" type="submit">
                    {t("Apply filters")}
                  </Button>
                  <Button onClick={clearFilter}>{t("Clear all")}</Button>
                </Stack>
              </Stack>
            </MenuList>
          </Menu>
          <IconButton
            icon={<Icon name="refreshCcw" />}
            aria-label={t("Reload")}
            onClick={() => refetch()}
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
                title={t("There is no task")}
                description={t(
                  "Tasks will appear when diagnostics are performed"
                )}
              />
            )}
          </>
        )}
      </Stack>
      <TaskDialog id={taskId} {...disclosure} onClose={onClose} />
    </>
  );
}
