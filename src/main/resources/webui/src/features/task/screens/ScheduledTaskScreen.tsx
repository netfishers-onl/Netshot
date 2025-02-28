import {
  DataTable,
  EmptyResult,
  FormControl,
  Icon,
  Search,
} from "@/components";
import { FormControlType } from "@/components/FormControl";
import TaskDialog from "@/components/TaskDialog";
import { TaskStatus } from "@/types";
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
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useTask } from "../hooks";

export default function AllTaskScreen() {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    refetch,
    onBottomReached,
    pagination,
    form,
    applyFilter,
    clearFilter,
    taskId,
    disclosure,
    onClose,
    columns,
  } = useTask(TaskStatus.Scheduled);

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Scheduled tasks")}
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
              <DataTable
                columns={columns}
                data={data}
                loading={isLoading}
                onBottomReached={onBottomReached}
              />
            ) : (
              <EmptyResult
                title={t("There is no scheduled task")}
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
