import api from "@/api";
import { ReportQueryParams } from "@/api/report";
import { Chart, Sidebar } from "@/components";
import { useColor } from "@/theme";
import {
  Box,
  Divider,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ChartConfiguration } from "chart.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import { useConfigurationCompliance } from "../contexts";
import ConfigurationCompliantSidebarList from "./ConfigurationComplianceSidebarList";
import ConfigurationComplianceSidebarSearch from "./ConfigurationComplianceSidebarSearch";

function ConfigurationComplianceGlobalChart() {
  const { t } = useTranslation();
  const compliantColor = useColor("green.400");
  const nonCompliantColor = useColor("green.900");
  const ctx = useConfigurationCompliance();

  const { data: stats, isLoading } = useQuery(
    [
      QUERIES.CONFIGURATION_COMPLIANCE_STAT,
      ctx.filters.domains,
      ctx.filters.groups,
      ctx.filters.policies,
    ],
    async () => {
      const queryParams = {} as ReportQueryParams;
      const { domains, groups, policies } = ctx.filters;

      if (domains.length) {
        queryParams.domain = domains;
      }

      if (groups.length) {
        queryParams.group = groups;
      }

      if (policies.length) {
        queryParams.policy = policies;
      }

      return api.report.getAllGroupConfigComplianceStat(queryParams);
    }
  );

  const count = useMemo(() => {
    const output = {
      total: 0,
      compliant: 0,
      nonCompliant: 0,
    };

    if (!stats?.length) {
      return output;
    }

    output.total = stats.reduce((prev, current) => {
      prev += current.deviceCount;
      return prev;
    }, 0);

    output.compliant = stats.reduce((prev, current) => {
      prev += current.compliantDeviceCount;
      return prev;
    }, 0);

    output.nonCompliant = output.total - output.compliant;

    return output;
  }, [stats]);

  const config = useMemo(() => {
    const labels = [t("Compliant"), t("Non compliant")];
    const data = [count.compliant, count.nonCompliant];
    const backgroundColor = [compliantColor, nonCompliantColor];

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
    } as ChartConfiguration<"doughnut">;
  }, [t, count, compliantColor, nonCompliantColor]);

  return (
    <Stack spacing="5" p="5">
      <Stack w="100%" alignItems="center" h="140px">
        <Skeleton isLoaded={!isLoading} h="140px" borderRadius="full">
          <Chart w="100%" config={config} />
        </Skeleton>
      </Stack>
      <Stack spacing="2" cursor="pointer">
        <Stack direction="row" alignItems="center" spacing="3">
          <Skeleton isLoaded={!isLoading}>
            <Box w="14px" h="14px" borderRadius="4px" bg={nonCompliantColor} />
          </Skeleton>
          <Skeleton isLoaded={!isLoading}>
            <Text>{t("Non compliant")}</Text>
          </Skeleton>

          <Spacer />
          <Skeleton isLoaded={!isLoading}>
            <Tag bg="green.900" color="green.50">
              {count.nonCompliant}
            </Tag>
          </Skeleton>
        </Stack>
        <Divider />
        <Stack direction="row" alignItems="center" spacing="3">
          <Skeleton isLoaded={!isLoading}>
            <Box w="14px" h="14px" borderRadius="4px" bg={compliantColor} />
          </Skeleton>
          <Skeleton isLoaded={!isLoading}>
            <Text>{t("Compliant")}</Text>
          </Skeleton>

          <Spacer />
          <Skeleton isLoaded={!isLoading}>
            <Tag bg="green.50" color="green.900">
              {count.compliant}
            </Tag>
          </Skeleton>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default function ConfigurationComplianceSidebar() {
  return (
    <Sidebar>
      <ConfigurationComplianceGlobalChart />
      <Divider />
      <ConfigurationComplianceSidebarSearch />
      <Divider />
      <ConfigurationCompliantSidebarList />
    </Sidebar>
  );
}
