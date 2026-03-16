import api from "@/api"
import { QueryBuilderButton, QueryBuilderValue } from "@/components"
import { QUERIES } from "@/constants"
import { DeviceType } from "@/types"
import { Button, Center, Heading, Spinner, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef } from "react"
import { useTranslation } from "react-i18next"
import GroupDeviceBox from "./GroupDeviceBox"

export type DynamicGroupDeviceListProps = {
  driver: DeviceType["name"]
  query: string
  onUpdateQuery(values: QueryBuilderValue): void
}

export default function DynamicGroupDeviceList(props: DynamicGroupDeviceListProps) {
  const { query, driver, onUpdateQuery } = props

  const { t } = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)

  const { data, isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_GROUP_AGGREGATED_SEARCH, query, driver],
    queryFn: async () => {
      return api.device.search({
        driver,
        query,
      })
    },
  })

  const virtualizer = useVirtualizer({
    count: data?.devices?.length ?? 0,
    getScrollElement: () => contentRef.current,
    estimateSize: () => 100,
    gap: 8,
  })

  const isEmptyOrUndefined = data === undefined || data?.devices?.length === 0

  if (isPending) {
    return (
      <Center flex="1">
        <Stack alignItems="center" gap="4">
          <Spinner size="lg" />
          <Stack alignItems="center" gap="1">
            <Heading size="md">{t("Loading")}</Heading>
            <Text color="grey.400">{t("Aggregating device in progress")}</Text>
          </Stack>
        </Stack>
      </Center>
    )
  }

  if (isEmptyOrUndefined) {
    return (
      <Center flex="1">
        <Stack alignItems="center" gap="4">
          <Stack alignItems="center" gap="1">
            <Heading size="md">{t("No results")}</Heading>
            <Text color="grey.400">{t("No device matching the criteria")}</Text>
          </Stack>

          <QueryBuilderButton
            renderItem={(open) => <Button onClick={open}>{t("Edit query")}</Button>}
            onSubmit={onUpdateQuery}
          />
        </Stack>
      </Center>
    )
  }

  return (
    <Stack ref={contentRef} overflow="auto" flex="1">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const device = data?.devices?.[virtualItem.index]

          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <GroupDeviceBox device={device} />
            </div>
          )
        })}
      </div>
    </Stack>
  )
}
