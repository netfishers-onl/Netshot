import api from "@/api"
import { EmptyResult, ExpandablePanel, Search } from "@/components"
import { usePagination } from "@/hooks"
import { ClusterMember } from "@/types"
import { useLocalization } from "@/i18n"
import { search } from "@/utils"
import { Button, Heading, Separator, Skeleton, Spacer, Stack, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"
import { LuRefreshCcw } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { QUERIES } from "../constants"

export default function AdministrationClusteringScreen() {
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const pagination = usePagination()

  const {
    data = [],
    isPending,
    refetch,
  } = useQuery({
    queryKey: [QUERIES.ADMIN_CLUSTERS],
    queryFn: async () => api.admin.getAllClusterMembers(),
    select: useCallback(
      (res: ClusterMember[]): ClusterMember[] => {
        return search(res, "hostname").with(pagination.query)
      },
      [pagination.query]
    ),
  })

  return (
    <>
      <Stack gap="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("admin.clustering.label")}
        </Heading>
        <Stack direction="row" gap="3">
          <Search
            placeholder={t("common.searchPlaceholder")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <Button onClick={() => refetch()}>
            <LuRefreshCcw />
            {t("common.refresh")}
          </Button>
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
              <Stack gap="3">
                {data.map((item) => (
                  <ExpandablePanel key={item.hostname}>
                    <ExpandablePanel.Header>
                      <Stack direction="row" justifyContent="space-between" flex="1">
                        <Stack direction="row" gap="3">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.hostname}
                          </Text>
                          <Tag.Root colorPalette="green">{t("admin.clustering.master")}</Tag.Root>
                        </Stack>
                        <Stack direction="row" gap="3">
                          <Tag.Root colorPalette="grey">
                            {item?.local ? t("user.local") : t("common.external")}
                          </Tag.Root>
                          <Tag.Root colorPalette="grey">
                            {t("admin.driver.checksum")} {item?.driverHash}
                          </Tag.Root>
                        </Stack>
                      </Stack>
                    </ExpandablePanel.Header>
                    <ExpandablePanel.Content>
                      <Stack direction="row" gap="8">
                        <Stack gap="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.appVersion}
                          </Text>
                          <Text color="grey.400">{t("about.version")}</Text>
                        </Stack>
                        <Separator orientation="vertical" />
                        <Stack gap="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.masterPriority}
                          </Text>
                          <Text color="grey.400">{t("admin.clustering.masterPriority")}</Text>
                        </Stack>
                        <Separator orientation="vertical" />
                        <Stack gap="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.runnerPriority}
                          </Text>
                          <Text color="grey.400">{t("task.runnerPriority")}</Text>
                        </Stack>
                        <Separator orientation="vertical" />
                        <Stack gap="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {item?.runnerWeight}
                          </Text>
                          <Text color="grey.400">{t("task.runnerWeight")}</Text>
                        </Stack>
                        <Separator orientation="vertical" />
                        <Stack gap="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {formatDateTime(item?.lastSeenTime)}
                          </Text>
                          <Text color="grey.400">{t("device.lastSeen")}</Text>
                        </Stack>
                        <Separator orientation="vertical" />
                        <Stack gap="0">
                          <Text fontWeight="semibold" fontSize="lg">
                            {formatDateTime(item?.lastStatusChangeTime)}
                          </Text>
                          <Text color="grey.400">{t("compliance.lastStatusChange")}</Text>
                        </Stack>
                      </Stack>
                    </ExpandablePanel.Content>
                  </ExpandablePanel>
                ))}
              </Stack>
            ) : (
              <EmptyResult
                title={t("compliance.hardware.noMember")}
                description={t("admin.clustering.activateHint")}
              />
            )}
          </>
        )}
      </Stack>
    </>
  )
}
