import { TASK_STATUS_CONFIG } from "@/components"
import { TaskStatus, TaskType } from "@/types"
import { Box, Button, Checkbox, Heading, Progress, Separator, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { TASK_TYPE_KEYS } from "../constants"
import { useTaskStats, useTaskSummary } from "../hooks"
import { useTaskFilterStore } from "../stores/useTaskFilterStore"

function StatusDot({ status }: { status: TaskStatus }) {
  const colorPalette = TASK_STATUS_CONFIG[status]?.colorPalette
  return <Box w="10px" h="10px" borderRadius="sm" bg={`${colorPalette}.500`} flexShrink={0} />
}

function TaskTypeLabel({ type }: { type: TaskType }) {
  const { t } = useTranslation()
  return <>{t(`task.type.${type}`)}</>
}

export default function TaskSidebar() {
  const { t } = useTranslation()
  const statusSel = useTaskFilterStore((s) => s.statusSel)
  const typeSel = useTaskFilterStore((s) => s.typeSel)
  const toggleStatus = useTaskFilterStore((s) => s.toggleStatus)
  const toggleType = useTaskFilterStore((s) => s.toggleType)
  const selectAllTypes = useTaskFilterStore((s) => s.selectAllTypes)
  const deselectAllTypes = useTaskFilterStore((s) => s.deselectAllTypes)

  const { countByStatus, threadCount } = useTaskSummary()
  const { typeCounts } = useTaskStats()

  const runningCount = countByStatus[TaskStatus.Running] ?? 0
  const waitingCount = countByStatus[TaskStatus.Waiting] ?? 0
  const scheduledCount = countByStatus[TaskStatus.Scheduled] ?? 0
  const freeSlots = Math.max(0, threadCount - runningCount)

  const waitingCaption =
    waitingCount === 0
      ? t("task.queueEmpty")
      : freeSlots > 0
        ? t("task.queueNextInLine")
        : t("task.queueBlocked")

  const scheduledCaption = scheduledCount > 0 ? t("task.scheduledWillTrigger") : t("task.nothingScheduled")

  function toggleBoxProps(status: TaskStatus) {
    const on = Boolean(statusSel[status])
    return {
      onClick: () => toggleStatus(status),
      cursor: "pointer" as const,
      p: "3",
      borderRadius: "xl" as const,
      borderWidth: "1px",
      borderColor: on ? "grey.100" : "grey.50",
      bg: "white",
      opacity: on ? 1 : 0.5,
      transition: "all .2s ease",
    }
  }

  return (
    <Stack w="300px" flex="none" overflow="auto" gap="0">
      <Stack gap="4" py="4" px="5">
        <Stack direction="row" alignItems="baseline" justifyContent="space-between">
          <Heading size="sm" fontWeight="semibold">
            {t("task.rightNow")}
          </Heading>
          <Text fontSize="xs" color="grey.400">
            {t("task.live")}
          </Text>
        </Stack>

        <Stack gap="2">
          <Box {...toggleBoxProps(TaskStatus.Running)}>
            <Stack direction="row" alignItems="center" gap="2">
              <StatusDot status={TaskStatus.Running} />
              <Text fontSize="sm" fontWeight="medium" color="grey.700" flex="1">
                {t("common.running")}
              </Text>
              <Text fontSize="md" fontWeight="bold">
                {runningCount}
              </Text>
              <Text fontSize="xs" color="grey.400">
                / {threadCount}
              </Text>
            </Stack>
            <Progress.Root value={runningCount} max={Math.max(threadCount, 1)} size="xs" mt="2" colorPalette="blue">
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize="xs" color="grey.400" mt="1">
              {freeSlots > 0 ? t("task.slotsFree", { count: freeSlots }) : t("task.allThreadsBusy")}
            </Text>
          </Box>

          <Box {...toggleBoxProps(TaskStatus.Waiting)}>
            <Stack direction="row" alignItems="center" gap="2">
              <StatusDot status={TaskStatus.Waiting} />
              <Text fontSize="sm" fontWeight="medium" color="grey.700" flex="1">
                {t("task.waitingInQueue")}
              </Text>
              <Text fontSize="md" fontWeight="bold">
                {waitingCount}
              </Text>
            </Stack>
            <Text fontSize="xs" color="grey.400" mt="1">
              {waitingCaption}
            </Text>
          </Box>

          <Box {...toggleBoxProps(TaskStatus.Scheduled)}>
            <Stack direction="row" alignItems="center" gap="2">
              <StatusDot status={TaskStatus.Scheduled} />
              <Text fontSize="sm" fontWeight="medium" color="grey.700" flex="1">
                {t("task.scheduledFuture")}
              </Text>
              <Text fontSize="md" fontWeight="bold">
                {scheduledCount}
              </Text>
            </Stack>
            <Text fontSize="xs" color="grey.400" mt="1">
              {scheduledCaption}
            </Text>
          </Box>
        </Stack>
      </Stack>

      <Separator />

      <Stack gap="2" py="4" px="5">
        <Heading size="sm" fontWeight="semibold">
          {t("task.taskType")}
        </Heading>
        <Stack gap="0">
          {TASK_TYPE_KEYS.map((type) => (
            <Stack
              key={type}
              direction="row"
              alignItems="center"
              gap="3"
              px="2"
              py="2"
              borderRadius="lg"
              cursor="pointer"
              onClick={() => toggleType(type)}
              _hover={{ bg: "grey.50" }}
            >
              <Checkbox.Root readOnly checked={Boolean(typeSel[type])} pointerEvents="none">
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox.Root>
              <Text fontSize="sm" color="grey.700" flex="1">
                <TaskTypeLabel type={type} />
              </Text>
              <Text fontSize="xs" color="grey.400">
                {typeCounts[type] ?? 0}
              </Text>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" gap="3" pt="1">
          <Button variant="ghost" size="xs" color="green.600" onClick={selectAllTypes}>
            {t("common.selectAll")}
          </Button>
          <Button variant="ghost" size="xs" color="grey.400" onClick={deselectAllTypes}>
            {t("common.clearAll")}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}
