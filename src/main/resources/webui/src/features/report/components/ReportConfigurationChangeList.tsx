import api from "@/api"
import { DataTable, EmptyResult, EntityLink, Icon } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { LightConfig } from "@/types"
import { formatDate, sortByDateAsc } from "@/utils"
import { Button, IconButton, Input, Skeleton, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { ChangeEvent, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"
import { usePeriodOptions } from "../hooks"
import { Period, PeriodType } from "../types"
import ReportConfigurationCompareModal from "./ReportConfigurationCompareModal"

const columnHelper = createColumnHelper<LightConfig>()

export default function ReportConfigurationChangeList() {
  const { t } = useTranslation()
  const periodOptions = usePeriodOptions()

  const [day, setDay] = useState<string>(formatDate(new Date().toISOString(), "yyyy-MM-dd"))
  const [currentPeriod, setCurrentPeriod] = useState<Period>(periodOptions.getFirst())

  const range = useMemo(() => {
    if (currentPeriod.label === PeriodType.SpecificDay) {
      return currentPeriod.value(new Date(day))
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

  function onChangeDay(evt: ChangeEvent<HTMLInputElement>) {
    setDay(formatDate(new Date(evt.target.value).toISOString(), "yyyy-MM-dd"))
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("changeDate", {
        cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("N/A")}</Text>,
        header: t("Date/time"),
      }),
      columnHelper.accessor("deviceName", {
        cell: (info) => (
          <EntityLink to={`/app/devices/${info.row.original.deviceId}/configuration`}>
            {info.getValue()}
          </EntityLink>
        ),
        header: t("Device"),
      }),
      columnHelper.accessor("author", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Author"),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
          <ReportConfigurationCompareModal
            config={info.row.original}
            renderItem={(open) => (
              <Tooltip content={t("Show difference")}>
                <IconButton
                  variant="ghost"
                  colorPalette="green"
                  aria-label={t("Show difference")}
                  onClick={open}
                >
                  <Icon name="gitBranch" />
                </IconButton>
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
              {period.label}
            </Button>
          ))}
        </Stack>
        {currentPeriod.label === PeriodType.SpecificDay && (
          <Input type="date" value={String(day)} onChange={onChangeDay} />
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
              title={t("There is no configuration change")}
              description={t("Here you can view the configuration changed list")}
            ></EmptyResult>
          )}
        </>
      )}
    </Stack>
  )
}
