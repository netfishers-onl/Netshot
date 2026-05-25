import api from "@/api"
import { Chart } from "@/components"
import { useI18nUtil } from "@/i18n/useI18nUtil"
import { Steps, Heading, Skeleton, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query"
import { ChartConfiguration } from "chart.js/auto"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export default function ReportConfigurationChart() {
  const { t } = useTranslation()
  const { formatDayMonth } = useI18nUtil()

  const { data: changes = [], isPending } = useQuery({
    queryKey: [QUERIES.REPORT_CONFIG_CHANGE_OVER_LAST_DAY],
    queryFn: api.report.getConfigChangeOverLastDay,
  })

  const config = useMemo(() => {
    if (!Array.isArray(changes)) {
      return {} as ChartConfiguration
    }

    let changeMax = 1

    const labels = changes.map((change) => formatDayMonth(change?.changeDay))
    const data = changes.map((change) => {
      changeMax = Math.max(changeMax, change.changeCount)
      return change.changeCount
    })

    return {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            maxTicksLimit: Math.min(5, changeMax + 2),
            suggestedMax: changeMax * 4,
          },
        },
      },
    } as ChartConfiguration
  }, [changes, formatDayMonth])

  return (
    <Stack gap="5">
      <Heading as="h4" fontSize="2xl">
        {t("device.changesOverLastDays")}
      </Heading>
      {isPending ? (
        <Skeleton height="250px" />
      ) : (
        <Stack h="250px">
          <Chart config={config} />
        </Stack>
      )}
    </Stack>
  );
}
