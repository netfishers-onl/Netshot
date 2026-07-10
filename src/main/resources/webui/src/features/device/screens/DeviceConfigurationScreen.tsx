import { EmptyResult } from "@/components"
import { Button, Skeleton, Stack } from "@chakra-ui/react"
import { AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import { useInfiniteDeviceConfigs } from "../api"
import { DeviceConfigurationCompareWidget } from "../components/DeviceConfigurationCompareWidget"
import DeviceConfigurationPanel from "../components/DeviceConfigurationPanel"
import { useDeviceConfigurationCompareStore } from "../stores"

export default function DeviceConfigurationScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const current = useDeviceConfigurationCompareStore((state) => state.current)

  const { data, isPending, isSuccess, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteDeviceConfigs(+params.id, "")

  if (data?.length === 0) {
    return (
      <EmptyResult
        title={t("device.config.noneForDevice")}
        description={t("device.config.noConfiguration")}
      />
    )
  }

  return (
    <Stack gap="6">
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
          {t("common.loadMore")}
        </Button>
      )}
    </Stack>
  )
}
