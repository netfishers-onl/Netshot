import { EmptyResult } from "@/components"
import Search from "@/components/Search"
import { Button, Skeleton, Stack } from "@chakra-ui/react"
import { AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import { useInfiniteDeviceConfigs } from "../api"
import { DeviceConfigurationCompareWidget } from "../components/DeviceConfigurationCompareWidget"
import DeviceConfigurationPanel from "../components/DeviceConfigurationPanel"
import { useDeviceConfigurationCompareStore } from "../stores"

export default function DeviceConfigurationScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [query, setQuery] = useState<string>("")
  const current = useDeviceConfigurationCompareStore((state) => state.current)

  const { data, isPending, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteDeviceConfigs(+params.id, query)

  function onQuery(value: string) {
    setQuery(value)
  }

  function onQueryClear() {
    setQuery("")
  }

  if (data?.length === 0) {
    return (
      <EmptyResult
        title={t("thereIsNoConfigurationForThisDevice")}
        description={t("thisDeviceDoesNotHaveAnyConfigurationPleaseRunASnapshot")}
      />
    )
  }

  return (
    <Stack gap="6">
      <Stack direction="row" gap="3">
        <Search placeholder={t("searchPlaceholder")} onQuery={onQuery} onClear={onQueryClear} w="50%" />
      </Stack>
      <Stack gap="3">
        {isPending ? (
          <>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
          </>
        ) : (
          <>
            <AnimatePresence>{current && <DeviceConfigurationCompareWidget />}</AnimatePresence>
            {isSuccess &&
              data?.map((config) => <DeviceConfigurationPanel config={config} key={config?.id} />)}
          </>
        )}
      </Stack>
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
          {t("loadMore")}
        </Button>
      )}
    </Stack>
  )
}
