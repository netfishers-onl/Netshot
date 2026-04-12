import { DataTable, EmptyResult, FormControl, Icon, Search } from "@/components"
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
        {t("runningTasks")}
      </Heading>
      <Stack direction="row" gap="3">
        <Search
          placeholder={t("searchPlaceholder")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="primary">
              <Icon name="filter" />
              {t("filters")}
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
                      label={t("executionDate")}
                    />
                    <Stack gap="2">
                      <Button variant="primary" type="submit">
                        {t("applyFilters")}
                      </Button>
                      <Button onClick={clearFilter}>{t("clearAll")}</Button>
                    </Stack>
                  </form>
                </Stack>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <IconButton aria-label={t("reload")} onClick={() => refetch()} loading={isFetching}>
          <Icon name="refreshCcw" />
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
              title={t("thereIsNoRunningTask")}
              description={t("noMatchingTaskWasFound")}
            />
          )}
        </>
      )}
    </Stack>
  )
}
