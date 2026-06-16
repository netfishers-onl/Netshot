import api from "@/api"
import { DataTable, EmptyResult, EntityLink } from "@/components"
import { LuCalendar, LuGitBranch } from "react-icons/lu"
import { Tooltip } from "@/components/ui/tooltip"
import { LightConfig } from "@/types"
import { useLocalization } from "@/i18n"
import { sortByDateAsc } from "@/utils"
import { Button, DatePicker, type DatePickerValueChangeDetails, IconButton, Portal, Skeleton, Stack, Text } from "@chakra-ui/react"
import { fromAbsolute, today, toZoned } from "@internationalized/date"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { usePeriodOptions } from "../hooks"
import { Period, PeriodType } from "../types"
import ConfigurationCompareModal from "./ConfigurationCompareModal"

const columnHelper = createColumnHelper<LightConfig>()

export default function ConfigurationChangeList() {
  const { t, i18n } = useTranslation()
  const { formatDateTime, datePlaceholder, timezone, numberToCalendarDate, calendarDateToTimestamp } = useLocalization()
  const periodOptions = usePeriodOptions()

  const [day, setDay] = useState<number>(() => toZoned(today(timezone), timezone).toDate().getTime())
  const [currentPeriod, setCurrentPeriod] = useState<Period>(periodOptions.getFirst())

  const range = useMemo(() => {
    if (currentPeriod.label === PeriodType.SpecificDay) {
      return currentPeriod.value(fromAbsolute(day, timezone).toDate())
    }

    return currentPeriod.value()
  }, [currentPeriod, day])

  const { data, isPending } = useQuery({
    queryKey: [QUERIES.REPORT_CONFIG_CHANGE_LIST, range.from, range.to],
    queryFn: async () =>
      api.config.getAll({
        after: range.from.getTime(),
        before: range.to.getTime(),
      }),
    select(res) {
      return sortByDateAsc(res, "changeDate")
    },
  })

  const dayCalendarValue = useMemo(() => numberToCalendarDate(day), [day, numberToCalendarDate])

  function onChangeDay({ value }: DatePickerValueChangeDetails) {
    if (value.length === 0) return
    setDay(calendarDateToTimestamp(value[0]))
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("changeDate", {
        cell: (info) => <Text>{info.getValue() ? formatDateTime(info.getValue()) : t("common.nA")}</Text>,
        header: t("time.dateTime"),
      }),
      columnHelper.accessor("deviceName", {
        cell: (info) => (
          <EntityLink to={`/app/devices/${info.row.original.deviceId}/configuration`}>
            {info.getValue()}
          </EntityLink>
        ),
        header: t("device.label"),
      }),
      columnHelper.accessor("author", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("common.author"),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
          <Tooltip content={t("common.showDifference")}>
            <ConfigurationCompareModal config={info.row.original}>
              <IconButton
                variant="ghost"
                colorPalette="green"
                aria-label={t("common.showDifference")}
              >
                <LuGitBranch />
              </IconButton>
            </ConfigurationCompareModal>
          </Tooltip>
        ),
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
      }),
    ],
    [t, formatDateTime]
  )

  return (
    <Stack gap="5" flex="1" overflowY="auto">
      <Stack direction="row" alignItems="center" gap="5">
        <Stack
          direction="row"
          p="2"
          border="1px solid"
          borderColor="grey.100"
          borderRadius="3xl"
          alignSelf="start"
        >
          {periodOptions.options.map((period) => (
            <Button
              key={period.label}
              variant="ghost"
              color={
                currentPeriod?.label === period.label ? "green.600!important" : "grey.400!important"
              }
              colorPalette={currentPeriod?.label === period.label ? "green" : "grey"}
              bg={currentPeriod?.label === period.label ? "green.50!important" : null}
              onClick={() => setCurrentPeriod(period)}
            >
              {t(period.label)}
            </Button>
          ))}
        </Stack>
        {currentPeriod.label === PeriodType.SpecificDay && (
          <DatePicker.Root
            value={dayCalendarValue ? [dayCalendarValue] : []}
            onValueChange={onChangeDay}
            locale={i18n.language}
            closeOnSelect
            placeholder={datePlaceholder}
          >
            <DatePicker.Control>
              <DatePicker.Input />
              <DatePicker.IndicatorGroup>
                <DatePicker.Trigger asChild>
                  <IconButton size="xs" variant="ghost" aria-label={t("common.openCalendar")}>
                    <LuCalendar />
                  </IconButton>
                </DatePicker.Trigger>
              </DatePicker.IndicatorGroup>
            </DatePicker.Control>
            <Portal>
              <DatePicker.Positioner>
                <DatePicker.Content>
                  <DatePicker.View view="day">
                    <DatePicker.Header />
                    <DatePicker.DayTable />
                  </DatePicker.View>
                  <DatePicker.View view="month">
                    <DatePicker.Header />
                    <DatePicker.MonthTable />
                  </DatePicker.View>
                  <DatePicker.View view="year">
                    <DatePicker.Header />
                    <DatePicker.YearTable />
                  </DatePicker.View>
                </DatePicker.Content>
              </DatePicker.Positioner>
            </Portal>
          </DatePicker.Root>
        )}
      </Stack>
      {isPending ? (
        <Stack gap="3">
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
          <Skeleton h="60px"></Skeleton>
        </Stack>
      ) : (
        <>
          {data?.length > 0 ? (
            <DataTable zIndex={0} columns={columns} data={data} loading={isPending} />
          ) : (
            <EmptyResult
              title={t("device.config.noChange")}
              description={t("device.hereYouCanViewConfigChangeList")}
            ></EmptyResult>
          )}
        </>
      )}
    </Stack>
  )
}
