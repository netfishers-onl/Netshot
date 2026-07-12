import api from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DeviceGroupBadge, TaskStatusBadge } from "@/components"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation, useDialogConfig } from "@/dialog"
import { DeviceBadge } from "@/features/device/components"
import { useToast } from "@/hooks"
import { useLocalization } from "@/i18n"
import { TaskScheduleType, TaskStatus } from "@/types"
import { getSchedulePriorityLabel } from "@/utils"
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  Portal,
  Separator,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { LuDownload } from "react-icons/lu"
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
  const [showLog, setShowLog] = useState<boolean>(false)

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

  const creationDate = task?.creationDate ? formatDateTime(task?.creationDate) : null
  const executionDate = task?.executionDate ? formatDateTime(task?.executionDate) : null
  const priorityLabel = getSchedulePriorityLabel(task?.priority)

  const scheduleLabel = task?.repeating
    ? `${t("time.every")} ${task.scheduleFactor} ${t(
        SCHEDULE_UNIT_KEY[task.scheduleType] ?? "time.day",
        { count: task.scheduleFactor }
      )}`
    : t("task.once")

  function toggleLog() {
    setShowLog((prev) => !prev)
  }

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
        label: t("common.cancel"),
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
                      <Text>{task?.id ?? "nA"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.description")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.taskDescription ?? "nA"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.comments")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.comments ?? "nA"}</Text>
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
                      ) : task?.deviceGroupId ? (
                        <DeviceGroupBadge
                          id={task.deviceGroupId}
                          name={task.target}
                          onClick={() => dialogConfig.close()}
                        />
                      ) : (
                        <Text>{task?.target ?? "nA"}</Text>
                      )}
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.creation")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{creationDate ?? "nA"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("common.execution")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{executionDate ?? "nA"}</Text>
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

                {task?.script && (
                  <>
                    <Separator />
                    <Stack gap="4">
                      <Heading size="md" fontWeight="semibold">
                        {t("script.label")}
                      </Heading>
                      <Stack gap="4">
                        <Box p="6" borderWidth="1px" borderColor="grey.100" borderRadius="xl">
                          <Text fontFamily="mono" whiteSpace="pre-wrap">
                            {task?.script}
                          </Text>
                        </Box>

                        {Object.keys(task?.userInputValues)?.map((key) => (
                          <Flex alignItems="center" key={key}>
                            <Box w="140px">
                              <Text color="grey.400">{key}</Text>
                            </Box>

                            <Text>{task?.userInputValues[key] ?? "nA"}</Text>
                          </Flex>
                        ))}
                      </Stack>
                    </Stack>
                  </>
                )}

                {showLog && (
                  <>
                    <Separator />
                    <Stack gap="4">
                      <Heading size="md" fontWeight="semibold">
                        {t("admin.logs.info")}
                      </Heading>
                      <Box
                        p="6"
                        bg="grey.50"
                        borderWidth="1px"
                        borderColor="grey.100"
                        borderRadius="xl"
                      >
                        <Text fontFamily="mono" whiteSpace="pre-wrap">
                          {task?.log}
                        </Text>
                      </Box>
                      <Button variant="ghost" size="sm" alignSelf="start" asChild>
                        <a
                          href={`/api/tasks/${task.id}/debuglog`}
                          download={`task-${task?.id}-debug.log`}
                        >
                          <LuDownload />
                          {t("admin.logs.debug")}
                        </a>
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
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
                <Button onClick={toggleLog} disabled={task?.log === ""}>
                  {t(showLog ? "common.hideLogs" : "common.showLogs")}
                </Button>
                <Button variant="primary" onClick={() => dialogConfig.close()}>
                  {t("common.ok")}
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
