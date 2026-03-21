import api from "@/api"
import { EmptyResult, Search } from "@/components"
import { QUERIES } from "@/constants"
import { usePagination } from "@/hooks"
import { ConfigComplianceDeviceStatus, Group } from "@/types"
import { groupItemsByProperty, search } from "@/utils"
import { Skeleton, Spacer, Stack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import DeviceConfigurationCompliancePanel from "./DeviceConfigurationCompliancePanel"

export type ConfigurationComplianceDeviceListProps = {
  group: Group
}

export default function ConfigurationComplianceDeviceList(
  props: ConfigurationComplianceDeviceListProps
) {
  const { group } = props

  const { t } = useTranslation()
  const pagination = usePagination()

  const { data, isPending } = useQuery({
    queryKey: [
      QUERIES.DEVICE_REPORT_GROUP_LIST,
      group.id,
      group.folder,
      group.name,
      pagination.query,
    ],
    queryFn: async () => api.report.getAllGroupConfigNonCompliantDevices(group.id),
    select: useCallback(
      (res: ConfigComplianceDeviceStatus[]): Map<"name", ConfigComplianceDeviceStatus[]> => {
        return groupItemsByProperty(search(res, "name").with(pagination.query), "name")
      },
      [pagination.query]
    ),
  })

  return (
    <>
      <Stack direction="row">
        <Search
          placeholder={t("search2")}
          onQuery={pagination.onQuery}
          onClear={pagination.onQueryClear}
          w="30%"
        />
        <Spacer />
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
          {data?.size > 0 ? (
            <>
              {Array.from(data.entries()).map(([key, value]) => (
                <DeviceConfigurationCompliancePanel configs={value} name={key} key={key} />
              ))}
            </>
          ) : (
            <EmptyResult
              title={t("noDevice")}
              description={t("thereIsNoDeviceInThisGroup")}
            />
          )}
        </>
      )}
    </>
  )
}
