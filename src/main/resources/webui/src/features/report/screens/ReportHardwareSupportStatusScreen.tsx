import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Chart, DataTable, Icon } from "@/components";
import { useToast } from "@/hooks";
import { useColor } from "@/theme";
import { GroupedHardwareSupportStat, HardwareSupportStatType } from "@/types";
import { formatDate, getDateFromUnix, groupStatByDate } from "@/utils";
import { Button, Heading, Skeleton, Spacer, Stack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { ChartConfiguration } from "chart.js/auto";
import { endOfMonth } from "date-fns";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HardwareDeviceListButton } from "../components";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<GroupedHardwareSupportStat>();

export default function ReportHardwareSupportStatusScreen() {
  const { t } = useTranslation();
  const green500 = useColor("green.500");
  const bronze500 = useColor("bronze.500");
  const grey500 = useColor("grey.500");
  const toast = useToast();
  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery([QUERIES.CONFIG_CHANGE], api.report.getAllHardwareSupportStat, {
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const config = useMemo(() => {
    if (!Array.isArray(stats)) {
      return null;
    }

    const labels = [];
    const datas: {
      eol: number[];
      eos: number[];
      max: number[];
    } = {
      eol: [],
      eos: [],
      max: [],
    };

    const counts = {
      eos: 0,
      eol: 0,
    };

    const max = {
      eos: 0,
      eol: 0,
      eox: 0,
    };
    const currentDate = new Date();

    currentDate.setMilliseconds(0);
    currentDate.setSeconds(0);
    currentDate.setMinutes(0);
    currentDate.setHours(0);
    currentDate.setDate(1);

    for (const stat of stats) {
      if (stat.type === HardwareSupportStatType.Eos) {
        max.eos += stat.deviceCount;
      } else if (stat.type === HardwareSupportStatType.Eol) {
        max.eol += stat.deviceCount;
      }
    }

    max.eox = max.eos > max.eol ? max.eos : max.eol;

    for (let m = -4 * 12; m < 8 * 12; m++) {
      const month = new Date(currentDate.valueOf());
      month.setMonth(m);
      const endMonth = endOfMonth(month);

      for (const stat of stats) {
        if (
          stat.eoxDate >= month.getTime() &&
          stat.eoxDate < endMonth.getTime()
        ) {
          if (stat.type === HardwareSupportStatType.Eos) {
            counts.eos += stat.deviceCount;
          } else if (stat.type === HardwareSupportStatType.Eol) {
            counts.eol += stat.deviceCount;
          }
        }
      }

      labels.push(
        month.getMonth() === 0 ? formatDate(month.getTime(), "yyyy-MM") : ""
      );
      datas.eos.push(counts.eos);
      datas.eol.push(counts.eol);
      datas.max.push(max.eox);
    }

    return {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: t("End-of-Life Devices"),
            backgroundColor: bronze500,
            data: datas.eol,
            borderWidth: 1,
            cubicInterpolationMode: "monotone",
            tension: 0.3,
          },
          {
            label: t("End-of-Sale Devices"),
            backgroundColor: grey500,
            data: datas.eos,
            borderWidth: 1,
            cubicInterpolationMode: "monotone",
            tension: 0.3,
          },
          {
            label: t("Total Devices"),
            backgroundColor: green500,
            data: datas.max,
            borderWidth: 1,
            cubicInterpolationMode: "monotone",
            tension: 0.3,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        bezierCurve: false,
        pointDot: false,
        scaleShowGridLines: false,
        scaleOverride: true,
        scaleSteps: 10,
        scaleStepWidth: Math.ceil(max.eox / 10),
        scaleStartValue: 0,
        scales: {
          y: {
            min: 0,
            maxTicksLimit: 10,
            suggestedMax: max.eox * 1.2,
          },
        },
      },
    } as ChartConfiguration;
  }, [isLoading, stats, t, green500, bronze500, grey500]);

  const getFormattedCount = useCallback(
    (info: CellContext<GroupedHardwareSupportStat, number>) => {
      const count = info.getValue();

      if (count > 1) {
        return t("{{count}} devices", {
          count,
        });
      }

      return t("{{count}} device", {
        count,
      });
    },
    [t]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        cell: (info) =>
          info.getValue()
            ? formatDate(getDateFromUnix(info.getValue()), "yyyy-MM-dd")
            : t("Never"),
        header: t("Date"),
      }),
      columnHelper.accessor("eos", {
        cell: (info) => {
          if (info.getValue() === 0) {
            return null;
          }

          return (
            <HardwareDeviceListButton
              type="eos"
              date={info.row.original.date || 0}
              renderItem={(open) => (
                <Button
                  variant="link"
                  onClick={open}
                  textDecoration="underline"
                >
                  +{getFormattedCount(info)}
                </Button>
              )}
            />
          );
        },
        header: t("End of sale"),
      }),
      columnHelper.accessor("eol", {
        cell: (info) => {
          if (info.getValue() === 0) {
            return null;
          }

          return (
            <HardwareDeviceListButton
              type="eol"
              date={info.row.original.date || 0}
              renderItem={(open) => (
                <Button
                  variant="link"
                  onClick={open}
                  textDecoration="underline"
                >
                  +{getFormattedCount(info)}
                </Button>
              )}
            />
          );
        },
        header: t("End of life"),
      }),
    ],
    [t]
  );

  const data = useMemo(() => groupStatByDate(stats), [stats]);

  return (
    <Stack spacing="8" p="9" flex="1" overflowY="auto">
      <Stack direction="row">
        <Heading as="h1" fontSize="4xl">
          {t("Hardware support status")}
        </Heading>
        <Spacer />

        <Button onClick={() => refetch()} leftIcon={<Icon name="refreshCcw" />}>
          {t("Refresh")}
        </Button>
      </Stack>
      <Stack spacing="5">
        <Heading as="h4" fontSize="2xl">
          {t("Overview")}
        </Heading>

        {isLoading ? (
          <Skeleton height="400px" />
        ) : (
          <Stack h="400px">
            <Chart config={config} />
          </Stack>
        )}
      </Stack>
      <Stack spacing="5" flex="1" overflowY="auto">
        <Heading as="h4" fontSize="2xl">
          {t("Milestone")}
        </Heading>
        {isLoading ? (
          <Stack spacing="3">
            <Skeleton h="60px" />
            <Skeleton h="60px" />
            <Skeleton h="60px" />
            <Skeleton h="60px" />
          </Stack>
        ) : (
          <DataTable data={data} columns={columns} />
        )}
      </Stack>
    </Stack>
  );
}
