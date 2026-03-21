import { Box, Separator, Skeleton, Spacer, Stack, Tag, Text, useToken } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { ChartConfiguration } from "chart.js"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import { Chart, Sidebar } from "@/components"

import { useShallow } from "zustand/react/shallow"
import { QUERIES } from "../constants"
import { useConfigurationComplianceSidebarStore } from "../stores/useConfigurationComplianceSidebarStore"
import ConfigurationCompliantSidebarList from "./ConfigurationComplianceSidebarList"
import ConfigurationComplianceSidebarSearch from "./ConfigurationComplianceSidebarSearch"

function ConfigurationComplianceGlobalChart() {
  const { t } = useTranslation()
  const [compliantColor] = useToken("colors", "green.400")
  const [nonCompliantColor] = useToken("colors", "green.900")
  const { domains, groups, policies } = useConfigurationComplianceSidebarStore(
    useShallow((state) => ({
      domains: state.domains,
      groups: state.groups,
      policies: state.policies,
    }))
  )
  const params = useParams<{
    id: string
  }>()

  const { data: stats, isPending } = useQuery({
    queryKey: [
      QUERIES.CONFIGURATION_COMPLIANCE_STAT,
      domains.sort().join(","),
      groups.sort().join(","),
      policies.sort().join(","),
      params?.id,
    ],
    queryFn: async () => {
      const filters = {
        domains,
        groups,
        policies,
      }

      if (params.id) {
        filters.groups.push(+params.id)
      }

      return api.report.getAllGroupConfigComplianceStats(filters)
    },
    gcTime: 0,
  })

  const count = useMemo(() => {
    const output = {
      total: 0,
      compliant: 0,
      nonCompliant: 0,
    }

    if (!stats?.length) {
      return output
    }

    output.total = stats.reduce((prev, current) => {
      prev += current.deviceCount
      return prev
    }, 0)

    output.compliant = stats.reduce((prev, current) => {
      prev += current.compliantDeviceCount
      return prev
    }, 0)

    output.nonCompliant = output.total - output.compliant

    return output
  }, [stats])

  const config = useMemo(() => {
    const labels = [t("compliant"), t("nonCompliant")]
    const data = [count.compliant, count.nonCompliant]
    const backgroundColor = [compliantColor, nonCompliantColor]

    return {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "70%",
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
          },
        },
      },
    } as ChartConfiguration<"doughnut">
  }, [t, count, compliantColor, nonCompliantColor])

  return (
    <Stack gap="5" p="5">
      <Stack w="100%" alignItems="center" h="140px">
        <Skeleton loading={!!isPending} h="140px" borderRadius="full">
          <Chart w="100%" config={config} />
        </Skeleton>
      </Stack>
      <Stack gap="2" cursor="pointer">
        <Stack direction="row" alignItems="center" gap="3">
          <Skeleton loading={!!isPending}>
            <Box w="14px" h="14px" borderRadius="4px" bg={nonCompliantColor} />
          </Skeleton>
          <Skeleton loading={!!isPending}>
            <Text>{t("nonCompliant")}</Text>
          </Skeleton>

          <Spacer />
          <Skeleton loading={!!isPending}>
            <Tag.Root bg="green.900" color="green.50">
              {count.nonCompliant}
            </Tag.Root>
          </Skeleton>
        </Stack>
        <Separator />
        <Stack direction="row" alignItems="center" gap="3">
          <Skeleton loading={!!isPending}>
            <Box w="14px" h="14px" borderRadius="4px" bg={compliantColor} />
          </Skeleton>
          <Skeleton loading={!!isPending}>
            <Text>{t("compliant")}</Text>
          </Skeleton>

          <Spacer />
          <Skeleton loading={!!isPending}>
            <Tag.Root bg="green.50" color="green.900">
              {count.compliant}
            </Tag.Root>
          </Skeleton>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default function ConfigurationComplianceSidebar() {
  return (
    <Sidebar>
      <ConfigurationComplianceSidebarSearch />
      <Separator />
      <ConfigurationCompliantSidebarList />
      <Separator />
      <ConfigurationComplianceGlobalChart />
    </Sidebar>
  )
}
