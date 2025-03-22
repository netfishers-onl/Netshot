import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Chart } from "@/components";
import { useToast } from "@/hooks";
import { Heading, Skeleton, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ChartConfiguration } from "chart.js/auto";
import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

export default function ReportConfigurationChart() {
  const toast = useToast();
  const { t } = useTranslation();

  const { data: changes = [], isPending } = useQuery({
    queryKey: [QUERIES.REPORT_CONFIG_CHANGE_OVER_LAST_DAY],
    queryFn: api.report.getConfigChangeOverLastDay,  
  });

  const config = useMemo(() => {
    if (!Array.isArray(changes)) {
      return {} as ChartConfiguration;
    }

    let changeMax = 1;

    const labels = changes.map((change) => format(change?.changeDay, "dd/MM"));
    const data = changes.map((change) => {
      changeMax = Math.max(changeMax, change.changeCount);
      return change.changeCount;
    });

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
    } as ChartConfiguration;
  }, [changes]);

  return (
    <Stack spacing="5">
      <Heading as="h4" fontSize="2xl">
        {t("Changes over the last days")}
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
