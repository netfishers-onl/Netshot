import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon } from "@/components";
import { useToast } from "@/hooks";
import { Config } from "@/types";
import { formatDate } from "@/utils";
import {
  Button,
  IconButton,
  Input,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PERIODS, QUERIES } from "../constants";
import { Period, PeriodType } from "../types";
import ReportConfigurationCompareModal from "./ReportConfigurationCompareModal";

const columnHelper = createColumnHelper<Config>();

export default function ReportConfigurationChangeList() {
  const toast = useToast();
  const { t } = useTranslation();

  const [day, setDay] = useState<string>(
    formatDate(new Date().toISOString(), "yyyy-MM-dd")
  );
  const [currentPeriod, setCurrentPeriod] = useState<Period>(PERIODS[0]);

  const range = useMemo(() => {
    if (currentPeriod.label === PeriodType.SpecificDay) {
      return currentPeriod.value(new Date(day));
    }

    return currentPeriod.value();
  }, [currentPeriod, day]);

  const { data, isLoading } = useQuery(
    [QUERIES.REPORT_CONFIG_CHANGE_LIST, range.from, range.to],
    async () =>
      api.config.getAll({
        after: range.from.getTime(),
        before: range.to.getTime(),
      }),
    {
      select(res) {
        return res.sort(
          (a, b) =>
            new Date(a.changeDate).getTime() - new Date(b.changeDate).getTime()
        );
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const onChangeDay = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    setDay(formatDate(new Date(evt.target.value).toISOString(), "yyyy-MM-dd"));
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("changeDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("Date/time"),
      }),
      columnHelper.accessor("deviceName", {
        cell: (info) => (
          <Text
            as={Link}
            to={`/app/device/${info.row.original.deviceId}/configuration`}
            textDecoration="underline"
          >
            {info.getValue()}
          </Text>
        ),
        header: t("Device"),
      }),
      columnHelper.accessor("author", {
        cell: (info) => info.getValue(),
        header: t("Author"),
      }),
      columnHelper.accessor("id", {
        cell: (info) => (
          <ReportConfigurationCompareModal
            config={info.row.original}
            renderItem={(open) => (
              <Tooltip label={t("Show difference")}>
                <IconButton
                  variant="ghost"
                  colorScheme="green"
                  aria-label={t("Show difference")}
                  icon={<Icon name="gitBranch" />}
                  onClick={open}
                />
              </Tooltip>
            )}
          />
        ),
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
      }),
    ],
    [t]
  );

  return (
    <Stack spacing="5" flex="1" overflowY="auto">
      <Stack direction="row" alignItems="center" spacing="5">
        <Stack
          direction="row"
          p="2"
          border="1px solid"
          borderColor="grey.100"
          borderRadius="3xl"
          alignSelf="start"
        >
          {PERIODS.map((period) => (
            <Button
              key={period.label}
              variant="ghost"
              color={
                currentPeriod?.label === period.label
                  ? "green.600!important"
                  : "grey.400!important"
              }
              colorScheme={
                currentPeriod?.label === period.label ? "green" : "grey"
              }
              bg={
                currentPeriod?.label === period.label
                  ? "green.50!important"
                  : null
              }
              onClick={() => setCurrentPeriod(period)}
            >
              {t(period.label)}
            </Button>
          ))}
        </Stack>
        {currentPeriod.label === PeriodType.SpecificDay && (
          <Input type="date" value={day} onChange={onChangeDay} />
        )}
      </Stack>

      {isLoading ? (
        <Stack spacing="3">
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
        </Stack>
      ) : (
        <>
          {data?.length > 0 ? (
            <DataTable
              zIndex={0}
              columns={columns}
              data={data}
              loading={isLoading}
            />
          ) : (
            <EmptyResult
              title={t("There is no configuration change")}
              description={t(
                "Here you can view the configuration changed list"
              )}
            ></EmptyResult>
          )}
        </>
      )}
    </Stack>
  );
}
