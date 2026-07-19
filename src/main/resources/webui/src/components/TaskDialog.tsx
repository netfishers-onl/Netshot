import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { LogPanel, TaskStatusBadge } from "@/components"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation, useCustomDialog, useDialogConfig } from "@/dialog"
import { DeviceBadge, DeviceGroupBadge } from "@/features/device/components"
import { TASK_TYPE_ICONS } from "@/features/task/constants"
import { useToast } from "@/hooks"
import { useLocalization } from "@/i18n"
import { TaskScheduleType, TaskStatus, TaskType } from "@/types"
import { getSchedulePriorityLabel } from "@/utils"
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  Icon,
  Portal,
  Separator,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LuDownload, LuScrollText } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

const SCHEDULE_UNIT_KEY: Partial<Record<TaskScheduleType, string>> = {
  [TaskScheduleType.Hourly]: "time.hour",
  [TaskScheduleType.Daily]: "time.day",
  [TaskScheduleType.Weekly]: "time.week",
  [TaskScheduleType.Monthly]: "time.month",
}

export type TaskDialogProps = {
  id: number
}

export default function TaskDialog(props: TaskDialogProps) {
  const { id } = props
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const dialogConfig = useDialogConfig()
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirmDialog = useConfirmDialogWithMutation()
  const taskDialog = useCustomDialog()

  const { data: task, isPending } = useQuery({
    queryKey: [QUERIES.TASK, id],
    queryFn: async () => api.task.getById(id),
    enabled: Boolean(id),
    refetchIntervalInBackground: true,
    refetchInterval: (q) => {
      if (dialogConfig.props.isOpen) {
        const taskStatus = q.state.data?.status
        if (
          taskStatus === TaskStatus.Cancelled ||
          taskStatus === TaskStatus.Failure ||
          taskStatus === TaskStatus.Success
        ) {
          return false
        }
        return 5000
      }
      return false
    },
  })

  const purgeGroupId =
    task?.type === TaskType.PurgeDatabase && task?.deviceGroupId ? task.deviceGroupId : null

  const snapshotTaskId =
    task?.type === TaskType.DiscoverDeviceType && task?.snapshotTaskId
      ? task.snapshotTaskId
      : null

  const { data: purgeGroup } = useQuery({
    queryKey: [QUERIES.GROUP_DETAIL, purgeGroupId],
    queryFn: async () => api.group.getById(purgeGroupId!),
    enabled: Boolean(purgeGroupId),
  })

  const creationDate = task?.creationDate ? formatDateTime(task?.creationDate) : null
  const priorityLabel = getSchedulePriorityLabel(task?.priority)

  // Not started yet: show the next scheduled run instead of the (empty) execution date
  const isNotYetExecuted =
    task?.status === TaskStatus.New ||
    task?.status === TaskStatus.Waiting ||
    task?.status === TaskStatus.Scheduled

  const isTaskOver =
    task?.status === TaskStatus.Success ||
    task?.status === TaskStatus.Failure ||
    task?.status === TaskStatus.Cancelled

  const executionDate = isNotYetExecuted
    ? task?.nextExecutionDate
      ? formatDateTime(task.nextExecutionDate)
      : t("task.asSoonAsPossible")
    : task?.status === TaskStatus.Cancelled
      ? t("common.cancelled")
      : task?.executionDate
        ? formatDateTime(task.executionDate)
        : null

  const scheduleLabel = task?.repeating
    ? `${t("time.every")} ${task.scheduleFactor} ${t(
        SCHEDULE_UNIT_KEY[task.scheduleType] ?? "time.day",
        { count: task.scheduleFactor }
      )}`
    : t("task.once")

  const cancelMutation = useMutation({
    mutationKey: MUTATIONS.TASK_CANCEL,
    mutationFn: async () => api.task.update(id, { cancelled: true }),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK, id] })
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("task:"),
      })
    },
    onError(err: NetshotError) {
      toast.error(err)
    },
  })

  function openCancelConfirm() {
    const dialogRef = confirmDialog.open(MUTATIONS.TASK_CANCEL, {
      title: t("task.cancelTask"),
      description: t("task.aboutToCancelTask"),
      async onConfirm() {
        await cancelMutation.mutateAsync()
        dialogRef.close()
        toast.success({
          title: t("common.success"),
          description: t("task.taskCancelled"),
        })
      },
      confirmButton: {
        label: t("task.cancelTask"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return (
    <Dialog.Root
      open={dialogConfig.props.isOpen}
      placement="center"
      motionPreset="slide-in-bottom"
      size="lg"
      onOpenChange={(e) => {
        if (!e.open) {
          dialogConfig.close()
        }
      }}
      onExitComplete={() => {
        dialogConfig.remove()
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header as="h3" fontSize="xl" lineHeight="120%" fontWeight="bold">
              {t("task.details")}
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="6">
                <Stack gap="3">
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.id")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.id ?? t("common.nA")}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.type")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      {task?.type ? (
                        <Stack direction="row" gap="2" alignItems="center">
                          <Icon size="sm">{TASK_TYPE_ICONS[task.type as TaskType]}</Icon>
                          <Text>{t(`task.type.${task.type}`)}</Text>
                        </Stack>
                      ) : (
                        <Text>{t("common.nA")}</Text>
                      )}
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.description")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.taskDescription ?? t("common.nA")}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.comments")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.comments ?? t("common.nA")}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.target")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      {task?.deviceId ? (
                        <DeviceBadge>
                          <Link
                            to={`/app/devices/${task.deviceId}/tasks`}
                            onClick={() => dialogConfig.close()}
                          >
                            {task.target}
                          </Link>
                        </DeviceBadge>
                      ) : task?.deviceGroupId && task?.type !== TaskType.PurgeDatabase ? (
                        <DeviceGroupBadge
                          id={task.deviceGroupId}
                          name={task.target}
                          onClick={() => dialogConfig.close()}
                        />
                      ) : (
                        <Text>{task?.target ?? t("common.nA")}</Text>
                      )}
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.creation")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{creationDate ?? t("common.nA")}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.execution")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{executionDate ?? t("common.nA")}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("task.schedule")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{scheduleLabel}</Text>
                    </Skeleton>
                  </Flex>
                  {task?.runnerId && (
                    <Flex alignItems="center">
                      <Box w="140px">
                        <Text color="grey.400">{t("task.runner")}</Text>
                      </Box>
                      <Skeleton loading={isPending}>
                        <Text>{task.runnerId}</Text>
                      </Skeleton>
                    </Flex>
                  )}
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.priority")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{t(priorityLabel)}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.status")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      {task?.status && <TaskStatusBadge status={task.status} />}
                    </Skeleton>
                  </Flex>
                </Stack>

                {task?.type === TaskType.DiscoverDeviceType && isTaskOver && (
                  <>
                    <Separator />
                    <Stack gap="3">
                      {task?.discoveredDeviceTypeDescription && (
                        <Flex alignItems="center">
                          <Box w="140px">
                            <Text color="grey.400">{t("task.discoveredDeviceType")}</Text>
                          </Box>
                          <Text>{task.discoveredDeviceTypeDescription}</Text>
                        </Flex>
                      )}
                      {snapshotTaskId && (
                        <Flex alignItems="center">
                          <Box w="140px">
                            <Text color="grey.400">{t("task.snapshotTask")}</Text>
                          </Box>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              dialogConfig.close()
                              taskDialog.open(<TaskDialog id={snapshotTaskId} />)
                            }}
                          >
                            #{snapshotTaskId}
                          </Button>
                        </Flex>
                      )}
                    </Stack>
                  </>
                )}

                {task?.type === TaskType.PurgeDatabase && (
                  <>
                    <Separator />
                    <Stack gap="3">
                      <Flex alignItems="center">
                        <Box w="140px">
                          <Text color="grey.400">{t("task.purge")}</Text>
                        </Box>
                        <Text>
                          {task.days} {t("time.day", { count: task.days })}
                        </Text>
                      </Flex>
                      {(task?.configDays ?? 0) > 0 && (
                        <Flex alignItems="center">
                          <Box w="140px">
                            <Text color="grey.400">{t("device.config.purge")}</Text>
                          </Box>
                          <Text>
                            {task.configDays} {t("time.day", { count: task.configDays })}
                          </Text>
                        </Flex>
                      )}
                      {(task?.configSize ?? 0) > 0 && (
                        <Flex alignItems="center">
                          <Box w="140px">
                            <Text color="grey.400">{t("device.config.size")}</Text>
                          </Box>
                          <Text>
                            {task.configSize} {t("common.kb")}
                          </Text>
                        </Flex>
                      )}
                      {(task?.configKeepDays ?? 0) > 0 && (
                        <Flex alignItems="center">
                          <Box w="140px">
                            <Text color="grey.400">{t("device.config.keep")}</Text>
                          </Box>
                          <Text>
                            {task.configKeepDays} {t("time.day", { count: task.configKeepDays })}
                          </Text>
                        </Flex>
                      )}
                      {(task?.moduleDays ?? 0) > 0 && (
                        <Flex alignItems="center">
                          <Box w="140px">
                            <Text color="grey.400">{t("device.module.delete")}</Text>
                          </Box>
                          <Text>
                            {task.moduleDays} {t("time.day", { count: task.moduleDays })}
                          </Text>
                        </Flex>
                      )}
                      {purgeGroup && (
                        <Flex alignItems="center">
                          <Box w="140px">
                            <Text color="grey.400">{t("common.limitTo")}</Text>
                          </Box>
                          <DeviceGroupBadge
                            id={purgeGroup.id}
                            name={purgeGroup.name}
                            onClick={() => dialogConfig.close()}
                          />
                        </Flex>
                      )}
                    </Stack>
                  </>
                )}

                {task?.type === TaskType.TakeGroupSnapshot && (task?.limitToOutofdateDeviceHours ?? 0) > 0 && (
                  <>
                    <Separator />
                    <Stack gap="3">
                      <Flex alignItems="center">
                        <Box w="140px">
                          <Text color="grey.400">{t("device.limitToUnchangedFor")}</Text>
                        </Box>
                        <Text>
                          {task.limitToOutofdateDeviceHours}{" "}
                          {t("time.hour", { count: task.limitToOutofdateDeviceHours })}
                        </Text>
                      </Flex>
                    </Stack>
                  </>
                )}

                {task?.script && (
                  <>
                    <Separator />
                    <Stack gap="4">
                      <Heading size="md" fontWeight="semibold">
                        {t("script.label")}
                      </Heading>
                      <Stack gap="4">
                        {task?.deviceDriver && (
                          <Flex alignItems="center">
                            <Box w="140px">
                              <Text color="grey.400">{t("admin.driver.label")}</Text>
                            </Box>
                            <Text>{task.deviceDriver}</Text>
                          </Flex>
                        )}
                        <Box p="6" borderWidth="1px" borderColor="grey.100" borderRadius="xl">
                          <Text fontFamily="mono" whiteSpace="pre-wrap">
                            {task?.script}
                          </Text>
                        </Box>

                        {Object.keys(task?.userInputValues ?? {}).map((key) => (
                          <Flex alignItems="center" key={key}>
                            <Box w="140px">
                              <Text color="grey.400">{key}</Text>
                            </Box>

                            <Text>{task?.userInputValues?.[key] ?? t("common.nA")}</Text>
                          </Flex>
                        ))}
                      </Stack>
                    </Stack>
                  </>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer justifyContent="space-between">
              <Stack direction="row" gap="2">
                {isTaskOver && (
                  <LogPanel
                    title={t("admin.logs.info")}
                    copyValue={task?.log}
                    trigger={
                      <Button size="sm" variant="ghost">
                        <LuScrollText />
                        {t("common.logs")}
                      </Button>
                    }
                  >
                    <Text fontSize="xs" whiteSpace="pre-wrap" fontFamily="mono">
                      {task?.log}
                    </Text>
                  </LogPanel>
                )}
                {task?.debugEnabled && isTaskOver && (
                  <Button size="sm" variant="ghost" asChild>
                    <a
                      href={`/api/tasks/${task.id}/debuglog`}
                      download={`task-${task.id}-debug.log`}
                    >
                      <LuDownload />
                      {t("admin.logs.debug")}
                    </a>
                  </Button>
                )}
              </Stack>
              <Stack direction="row" gap="3">
                {task?.status === TaskStatus.Scheduled && (
                  <Button
                    colorPalette="red"
                    variant="ghost"
                    onClick={openCancelConfirm}
                    loading={cancelMutation.isPending}
                  >
                    {t("task.cancelTask")}
                  </Button>
                )}
                <Button variant="default" onClick={() => dialogConfig.close()}>
                  {t("common.close")}
                </Button>
              </Stack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" variant="outline" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
