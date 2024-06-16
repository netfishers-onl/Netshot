import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult } from "@/components";
import { useToast } from "@/hooks";
import { useColor } from "@/theme";
import {
  DeviceSoftwareLevel,
  GroupSoftwareComplianceStat,
  SimpleDevice,
} from "@/types";
import { getSoftwareLevelColor } from "@/utils";
import { Box, Skeleton, Spacer, Stack, Tag, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";

const columnHelper = createColumnHelper<SimpleDevice>();

export type SoftwareComplianceDeviceListProps = {
  level: DeviceSoftwareLevel;
  groupId: number;
};

function SoftwareComplianceDeviceList(
  props: SoftwareComplianceDeviceListProps
) {
  const { level, groupId } = props;
  const { t } = useTranslation();
  const toast = useToast();

  const { data, isLoading } = useQuery(
    [QUERIES.SOFTWARE_COMPLIANCE_DEVICES, level],
    async () => api.report.getAllGroupDeviceBySoftwareLevel(groupId, level),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => info.getValue(),
        header: t("Device name"),
      }),
      columnHelper.accessor("mgmtAddress.ip", {
        cell: (info) => info.getValue(),
        header: t("Management IP"),
      }),
      columnHelper.accessor("softwareLevel", {
        cell: (info) => {
          const level = info.getValue();

          return <Tag colorScheme={getSoftwareLevelColor(level)}>{level}</Tag>;
        },
        header: t("Software level"),
      }),
    ],
    [t]
  );

  return isLoading ? (
    <Stack spacing="3">
      <Skeleton h="60px"></Skeleton>
      <Skeleton h="60px"></Skeleton>
      <Skeleton h="60px"></Skeleton>
      <Skeleton h="60px"></Skeleton>
    </Stack>
  ) : (
    <Stack flex="1">
      {data?.length > 0 ? (
        <DataTable columns={columns} data={data} loading={isLoading} />
      ) : (
        <EmptyResult
          title={t("There is no device")}
          description={t(
            "Device with level {{ level }} appears when software rule is validated",
            {
              level: t(level),
            }
          )}
        />
      )}
    </Stack>
  );
}

type SoftwareComplianceDialogProps = {
  item: GroupSoftwareComplianceStat;
};

export default function SoftwareComplianceDialog(
  props: SoftwareComplianceDialogProps
) {
  const { item } = props;
  const { t } = useTranslation();
  const gold = useColor("yellow.500");
  const silver = useColor("grey.200");
  const bronze = useColor("bronze.500");
  const nonCompliant = useColor("grey.900");
  const [selected, setSelected] = useState<DeviceSoftwareLevel>(
    DeviceSoftwareLevel.GOLD
  );

  const nonCompliantDeviceCount = useMemo(
    () =>
      item.deviceCount -
      item.goldDeviceCount -
      item.silverDeviceCount -
      item.bronzeDeviceCount,
    [
      item.goldDeviceCount,
      item.silverDeviceCount,
      item.bronzeDeviceCount,
      item.deviceCount,
    ]
  );

  const triggers = useMemo(
    () => [
      {
        label: t("Gold"),
        level: DeviceSoftwareLevel.GOLD,
        count: item.goldDeviceCount,
        color: gold,
      },
      {
        label: t("Silver"),
        level: DeviceSoftwareLevel.SILVER,
        count: item.silverDeviceCount,
        color: silver,
      },
      {
        label: t("Bronze"),
        level: DeviceSoftwareLevel.BRONZE,
        count: item.bronzeDeviceCount,
        color: bronze,
      },
      {
        label: t("Non compliant"),
        level: DeviceSoftwareLevel.NON_COMPLIANT,
        count: nonCompliantDeviceCount,
        color: nonCompliant,
      },
    ],
    [t, gold, silver, bronze, nonCompliant, nonCompliantDeviceCount, item]
  );

  return (
    <Stack direction="row" spacing="7" overflow="auto" flex="1">
      <Stack flex="0 0 340px" overflow="auto">
        <Stack spacing="2" overflow="auto">
          {triggers.map((trigger) => (
            <Stack
              key={trigger.label}
              direction="row"
              alignItems="center"
              border="1px solid"
              borderColor="grey.100"
              bg={trigger.level === selected ? "grey.50" : "white"}
              borderRadius="2xl"
              cursor="pointer"
              transition="all .2s ease"
              _hover={{
                bg: "grey.50",
              }}
              p="5"
              spacing="3"
              onClick={() => setSelected(trigger.level)}
            >
              <Box w="14px" h="14px" borderRadius="4px" bg={trigger.color} />
              <Text>{trigger.label}</Text>
              <Spacer />
              <Text>
                {trigger.count} {t(trigger.count > 1 ? "devices" : "device")}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
      {selected && (
        <SoftwareComplianceDeviceList groupId={item.groupId} level={selected} />
      )}
    </Stack>
  );
}
