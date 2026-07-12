import { Chart, TASK_STATUS_CONFIG } from "@/components"
import { useLocalization } from "@/i18n"
import { Badge, Box, Icon, Stack, Text, useToken } from "@chakra-ui/react"
import { ChartConfiguration } from "chart.js/auto"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FINAL_STATUS_KEYS } from "../constants"
import { useTaskStats } from "../hooks"
import { useTaskHistoryFilterStore } from "../stores/useTaskHistoryFilterStore"

export default function TaskHistogramCard() {
  const { t } = useTranslation()
  const { formatDayMonth, formatHourMinute, formatDayMonthHourMinute } = useLocalization()
  const { bins, statusCounts, unit } = useTaskStats()
  const statusSel = useTaskHistoryFilterStore((s) => s.statusSel)
  const toggleStatus = useTaskHistoryFilterStore((s) => s.toggleStatus)

  const colorTokens = useToken(
    "colors",
    FINAL_STATUS_KEYS.map((status) => `${TASK_STATUS_CONFIG[status].colorPalette}.500`)
  )

  const formatBinLabel = useMemo(() => {
    if (unit.labelPrecision === "day") return formatDayMonth
    const spansMultipleDays = bins.length > 0 && bins[bins.length - 1].to - bins[0].from > 86400000
    return spansMultipleDays ? formatDayMonthHourMinute : formatHourMinute
  }, [unit, bins, formatDayMonth, formatDayMonthHourMinute, formatHourMinute])

  const config = useMemo<ChartConfiguration>(() => {
    const labels = bins.map((bin) => formatBinLabel(bin.from))
    const visibleStatuses = FINAL_STATUS_KEYS.filter(
      (status) => statusSel.length === 0 || statusSel.includes(status)
    )
    const datasets = visibleStatuses.map((status) => ({
      label: t(TASK_STATUS_CONFIG[status].labelKey),
      data: bins.map((bin) => bin.countByStatus[status] ?? 0),
      backgroundColor: colorTokens[FINAL_STATUS_KEYS.indexOf(status)],
      borderWidth: 0,
      stack: "tasks",
    }))

    return {
      type: "bar",
      data: { labels, datasets },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              autoSkip: false,
              callback: (_value, index) => (index % 2 === 0 ? labels[index] : ""),
            },
          },
          y: { stacked: true, min: 0 },
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (items) => items[0]?.label,
            },
          },
        },
      },
    } as ChartConfiguration
  }, [bins, statusSel, colorTokens, t, formatBinLabel])

  return (
    <Stack gap="3" bg="white" borderWidth="1px" borderColor="grey.100" borderRadius="2xl" p="5">
      <Stack direction="row" alignItems="center" gap="4" flexWrap="wrap">
        <Stack direction="row" gap="2">
          {FINAL_STATUS_KEYS.map((status) => {
            const on = statusSel.length === 0 || statusSel.includes(status)
            const statusConfig = TASK_STATUS_CONFIG[status]
            return (
              <Badge
                key={status}
                onClick={() => toggleStatus(status)}
                variant="surface"
                colorPalette={statusConfig.colorPalette}
                cursor="pointer"
                opacity={on ? 1 : 0.45}
                display="inline-flex"
                alignItems="center"
                gap="1"
              >
                <Icon size="sm">{statusConfig.icon}</Icon>
                {t(statusConfig.labelKey)}
                <Text as="span" color="grey.400">
                  {statusCounts[status] ?? 0}
                </Text>
              </Badge>
            )
          })}
        </Stack>
      </Stack>
      <Box h="210px">
        <Chart config={config} h="100%" />
      </Box>
    </Stack>
  )
}
