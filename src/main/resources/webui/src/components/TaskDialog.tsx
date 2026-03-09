import api from "@/api"
import { QUERIES } from "@/constants"
import { useDialogConfig } from "@/dialog"
import { TaskStatus } from "@/types"
import { formatDate, getSchedulePriorityLabel } from "@/utils"
import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  Portal,
  Separator,
  Skeleton,
  Spinner,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Download } from "react-feather"
import { useTranslation } from "react-i18next"

export type TaskDialogProps = {
  id: number
}

export default function TaskDialog(props: TaskDialogProps) {
  const { id } = props
  const { t } = useTranslation()
  const dialogConfig = useDialogConfig()
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

  const creationDate = task?.creationDate ? formatDate(task?.creationDate) : null
  const executionDate = task?.executionDate ? formatDate(task?.executionDate) : null
  const priorityLabel = getSchedulePriorityLabel(task?.priority)

  function toggleLog() {
    setShowLog((prev) => !prev)
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
              {t("Task details")}
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="6">
                <Stack gap="3">
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("ID")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.id ?? "N/A"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("Description")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.taskDescription ?? "N/A"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("Comments")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{task?.comments ?? "N/A"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("Creation")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{creationDate ?? "N/A"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("Execution")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{executionDate ?? "N/A"}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("Priority")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      <Text>{t(priorityLabel ?? "N/A")}</Text>
                    </Skeleton>
                  </Flex>
                  <Flex alignItems="center">
                    <Box w="140px">
                      <Text color="grey.400">{t("Status")}</Text>
                    </Box>
                    <Skeleton loading={isPending}>
                      {task?.status === TaskStatus.Scheduled && (
                        <Tag.Root colorPalette="yellow">{t("Scheduled")}</Tag.Root>
                      )}
                      {task?.status === TaskStatus.Running && (
                        <Stack direction="row" alignItems="center" gap="3">
                          <Spinner size="sm" />
                          <Text>{t("Running")}</Text>
                        </Stack>
                      )}
                      {task?.status === TaskStatus.Failure && (
                        <Tag.Root colorPalette="red">{t("Failure")}</Tag.Root>
                      )}
                      {task?.status === TaskStatus.Cancelled && (
                        <Tag.Root colorPalette="grey">{t("Cancelled")}</Tag.Root>
                      )}
                      {task?.status === TaskStatus.Success && (
                        <Tag.Root colorPalette="green">{t("Success")}</Tag.Root>
                      )}
                      {task?.status === TaskStatus.Waiting && (
                        <Tag.Root colorPalette="grey">{t("Waiting")}</Tag.Root>
                      )}
                      {task?.status === TaskStatus.New && (
                        <Tag.Root colorPalette="grey">{t("New")}</Tag.Root>
                      )}
                    </Skeleton>
                  </Flex>
                </Stack>

                {task?.script && (
                  <>
                    <Separator />
                    <Stack gap="4">
                      <Heading size="md" fontWeight="semibold">
                        {t("Script")}
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

                            <Text>{task?.userInputValues[key] ?? "N/A"}</Text>
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
                        {t("Debug logs")}
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
                          <Download />
                          {t("Download logs")}
                        </a>
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Stack direction="row" gap="3">
                <Button onClick={toggleLog} disabled={task?.log === ""}>
                  {t(showLog ? "Hide logs" : "Show logs")}
                </Button>
                <Button variant="primary" onClick={() => dialogConfig.close()}>
                  {t("OK")}
                </Button>
              </Stack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
