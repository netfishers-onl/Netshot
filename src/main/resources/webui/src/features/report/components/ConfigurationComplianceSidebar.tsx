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
import { useParams } from "react-router";

import api, { ReportQueryParams } from "@/api";
import { Chart, Sidebar } from "@/components";
import { useColor } from "@/theme";
import { getValuesFromOptions } from "@/utils";

import { QUERIES } from "../constants";
import { useConfigurationCompliance } from "../contexts";
import ConfigurationCompliantSidebarList from "./ConfigurationComplianceSidebarList";
import ConfigurationComplianceSidebarSearch from "./ConfigurationComplianceSidebarSearch";

function ConfigurationComplianceGlobalChart() {
  const { t } = useTranslation();
  const compliantColor = useColor("green.400");
  const nonCompliantColor = useColor("green.900");
  const ctx = useConfigurationCompliance();
  const params = useParams<{
    id: string;
  }>();

  const { data: stats, isPending } = useQuery({
    queryKey: [
      QUERIES.CONFIGURATION_COMPLIANCE_STAT,
      ctx.filters.domains,
      ctx.filters.groups,
      ctx.filters.policies,
      params?.id,
    ],
   queryFn: async () => {
      const queryParams = {
        domain: [],
        group: [],
        policy: [],
      } as ReportQueryParams;

      const { domains, groups, policies } = ctx.filters;

      if (domains.length) {
        queryParams.domain = getValuesFromOptions(domains);
      }

      if (groups.length) {
        queryParams.group = groups.map((group) => group.id);
      }

      if (policies.length) {
        queryParams.policy = getValuesFromOptions(policies);
      }

      if (params.id) {
        queryParams.group = [...queryParams.group, +params.id];
      }

      return api.report.getAllGroupConfigComplianceStats(queryParams);
    },
    gcTime: 0,
  });

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
        <Skeleton isLoaded={!isPending} h="140px" borderRadius="full">
          <Chart w="100%" config={config} />
        </Skeleton>
      </Stack>
      <Stack spacing="2" cursor="pointer">
        <Stack direction="row" alignItems="center" spacing="3">
          <Skeleton isLoaded={!isPending}>
            <Box w="14px" h="14px" borderRadius="4px" bg={nonCompliantColor} />
          </Skeleton>
          <Skeleton isLoaded={!isPending}>
            <Text>{t("Non compliant")}</Text>
          </Skeleton>

          <Spacer />
          <Skeleton isLoaded={!isPending}>
            <Tag bg="green.900" color="green.50">
              {count.nonCompliant}
            </Tag>
          </Skeleton>
        </Stack>
        <Divider />
        <Stack direction="row" alignItems="center" spacing="3">
          <Skeleton isLoaded={!isPending}>
            <Box w="14px" h="14px" borderRadius="4px" bg={compliantColor} />
          </Skeleton>
          <Skeleton isLoaded={!isPending}>
            <Text>{t("Compliant")}</Text>
          </Skeleton>

          <Spacer />
          <Skeleton isLoaded={!isPending}>
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
      <ConfigurationComplianceSidebarSearch />
      <Divider />
      <ConfigurationCompliantSidebarList />
      <Divider />
      <ConfigurationComplianceGlobalChart />
    </Sidebar>
  );
}
