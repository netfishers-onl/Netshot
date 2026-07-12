import { Chart, TASK_STATUS_CONFIG } from "@/components"
import { useLocalization } from "@/i18n"
import { Badge, Box, Icon, Stack, Text, useToken } from "@chakra-ui/react"
import { ChartConfiguration } from "chart.js/auto"
import { PointerEvent, useCallback, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { FINAL_STATUS_KEYS } from "../constants"
import { useTaskStats } from "../hooks"
import { useTaskFilterStore } from "../stores/useTaskFilterStore"

export default function TaskHistogramCard() {
  const { t } = useTranslation()
  const { formatDayMonth } = useLocalization()
  const { bins, statusCounts, hasBrush, brushLow, brushHigh } = useTaskStats()
  const statusSel = useTaskFilterStore((s) => s.statusSel)
  const toggleStatus = useTaskFilterStore((s) => s.toggleStatus)
  const setBrush = useTaskFilterStore((s) => s.setBrush)

  const dragRef = useRef<number | null>(null)

  const colorTokens = useToken(
    "colors",
    FINAL_STATUS_KEYS.map((status) => `${TASK_STATUS_CONFIG[status].colorPalette}.500`)
  )

  const binFromClientX = useCallback(
    (el: HTMLElement, clientX: number) => {
      const rect = el.getBoundingClientRect()
      const frac = (clientX - rect.left) / rect.width
      return Math.max(0, Math.min(bins.length - 1, Math.floor(frac * bins.length)))
    },
    [bins.length]
  )

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (bins.length === 0) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture isn't critical to the brush interaction, ignore if unsupported.
    }
    const idx = binFromClientX(e.currentTarget, e.clientX)
    dragRef.current = idx
    setBrush(idx, idx)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragRef.current === null) return
    setBrush(dragRef.current, binFromClientX(e.currentTarget, e.clientX))
  }

  function onPointerUp() {
    dragRef.current = null
  }

  const config = useMemo<ChartConfiguration>(() => {
    const labels = bins.map((bin) => formatDayMonth(bin.from))
    const datasets = FINAL_STATUS_KEYS.filter((status) => statusSel[status]).map((status) => {
      const color = colorTokens[FINAL_STATUS_KEYS.indexOf(status)]
      return {
        label: t(TASK_STATUS_CONFIG[status].labelKey),
        data: bins.map((bin) => bin.countByStatus[status] ?? 0),
        backgroundColor: bins.map((_, idx) => {
          const inBrush = !hasBrush || (idx >= brushLow && idx <= brushHigh)
          return inBrush ? color : `${color}4d`
        }),
        borderWidth: 0,
        stack: "tasks",
      }
    })

    return {
      type: "bar",
      data: { labels, datasets },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false } },
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
  }, [bins, statusSel, colorTokens, hasBrush, brushLow, brushHigh, t, formatDayMonth])

  return (
    <Stack gap="3" bg="white" borderWidth="1px" borderColor="grey.100" borderRadius="2xl" p="5">
      <Stack direction="row" alignItems="center" gap="4" flexWrap="wrap">
        <Text fontSize="sm" fontWeight="semibold">
          {t("task.completedOverTime")}
        </Text>
        <Stack direction="row" gap="2">
          {FINAL_STATUS_KEYS.map((status) => {
            const on = Boolean(statusSel[status])
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
        <Text ml="auto" fontSize="xs" color="grey.400">
          {t("task.dragToZoom")}
        </Text>
      </Stack>
      <Box h="140px">
        <Chart
          config={config}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          cursor="crosshair"
          h="100%"
        />
      </Box>
    </Stack>
  )
}
