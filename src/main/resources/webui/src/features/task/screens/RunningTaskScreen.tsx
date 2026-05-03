import { DataTable, EmptyResult, FormControl, Search } from "@/components"
import { FiFilter, FiRefreshCcw } from "react-icons/fi"
import { FormControlType } from "@/components/FormControl"
import { TaskStatus } from "@/types"
import {
  Button,
  Heading,
  IconButton,
  Menu,
  Portal,
  Skeleton,
  Spacer,
  Stack,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useTask } from "../hooks"

export default function RunningTaskScreen() {
  const { t } = useTranslation()

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    onBottomReached,
    pagination,
    form,
    applyFilter,
    clearFilter,
    columns,
  } = useTask(TaskStatus.Running)

  return (
    <Stack gap="6" p="9" flex="1" overflow="auto">
      <Heading as="h1" fontSize="4xl">
        {t("task.running")}
      </Heading>
      <Stack direction="row" gap="3">
        <Search
          placeholder={t("common.searchPlaceholder")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="primary">
              <FiFilter />
              {t("common.filters")}
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Stack gap="6" p="3" asChild>
                  <form onSubmit={form.handleSubmit(applyFilter)}>
                    <FormControl
                      control={form.control}
                      name="executionDate"
                      type={FormControlType.Date}
                      label={t("time.executionDate")}
                    />
                    <Stack gap="2">
                      <Button variant="primary" type="submit">
                        {t("common.applyFilters")}
                      </Button>
                      <Button onClick={clearFilter}>{t("common.clearAll")}</Button>
                    </Stack>
                  </form>
                </Stack>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <IconButton aria-label={t("common.reload")} onClick={() => refetch()} loading={isFetching}>
          <FiRefreshCcw />
        </IconButton>
      </Stack>
      {isLoading ? (
        <Stack gap="3">
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
              title={t("task.noRunning")}
              description={t("task.noMatchingFound")}
            />
          )}
        </>
      )}
    </Stack>
  )
}
