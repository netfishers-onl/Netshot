import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult } from "@/components";
import { useModalConfig } from "@/dialog";
import { useToast } from "@/hooks";
import {
  DeviceSoftwareLevel,
  GroupSoftwareComplianceStat,
  SimpleDevice,
} from "@/types";
import { getSoftwareLevelColor } from "@/utils";
import {
  Box,
  Skeleton,
  Spacer,
  Stack,
  StackProps,
  Tag,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { PropsWithChildren, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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
  const modalConfig = useModalConfig();

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
        cell: (info) => (
          <Text
            as={Link}
            to={`/app/device/${info.row.original.id}/compliance`}
            onClick={() => modalConfig.close()}
            textDecoration="underline"
          >
            {info.getValue()}
          </Text>
        ),
        header: t("Device name"),
      }),
      columnHelper.accessor("mgmtAddress", {
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

type SoftwareComplianteDeviceBoxProps = PropsWithChildren<
  {
    level: DeviceSoftwareLevel;
    count: number;
    isActive: boolean;
  } & StackProps
>;

function SoftwareComplianteDeviceBox(props: SoftwareComplianteDeviceBoxProps) {
  const { children, level, count, isActive, ...other } = props;

  const { t } = useTranslation();

  const bg = useMemo(() => {
    return getSoftwareLevelColor(level);
  }, [level]);

  return (
    <Stack
      direction="row"
      alignItems="center"
      border="1px solid"
      borderColor="grey.100"
      bg={isActive ? "grey.50" : "white"}
      borderRadius="2xl"
      cursor="pointer"
      transition="all .2s ease"
      _hover={{
        bg: "grey.50",
      }}
      p="5"
      spacing="3"
      {...other}
    >
      <Box w="14px" h="14px" borderRadius="4px" bg={bg} />
      {children}
      <Spacer />
      <Text>
        {count} {t(count > 1 ? "devices" : "device")}
      </Text>
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
  const [selected, setSelected] = useState<DeviceSoftwareLevel>(
    DeviceSoftwareLevel.GOLD
  );

  const nonCompliantDeviceCount = useMemo(
    () =>
      item.deviceCount -
      item.goldDeviceCount -
      item.silverDeviceCount -
      item.bronzeDeviceCount,
    [item]
  );

  const triggers = useMemo(
    () => [
      {
        label: t("Gold"),
        level: DeviceSoftwareLevel.GOLD,
        count: item.goldDeviceCount,
      },
      {
        label: t("Silver"),
        level: DeviceSoftwareLevel.SILVER,
        count: item.silverDeviceCount,
      },
      {
        label: t("Bronze"),
        level: DeviceSoftwareLevel.BRONZE,
        count: item.bronzeDeviceCount,
      },
      {
        label: t("Non compliant"),
        level: DeviceSoftwareLevel.NON_COMPLIANT,
        count: nonCompliantDeviceCount,
      },
    ],
    [t, nonCompliantDeviceCount, item]
  );

  return (
    <Stack direction="row" spacing="7" overflow="auto" flex="1">
      <Stack flex="0 0 340px" overflow="auto">
        <Stack spacing="2" overflow="auto">
          {triggers.map((trigger) => (
            <SoftwareComplianteDeviceBox
              key={trigger.label}
              onClick={() => setSelected(trigger.level)}
              level={trigger.level}
              count={trigger.count}
              isActive={trigger.level === selected}
            >
              <Text>{trigger.label}</Text>
            </SoftwareComplianteDeviceBox>
          ))}
        </Stack>
      </Stack>
      {selected && (
        <SoftwareComplianceDeviceList groupId={item.groupId} level={selected} />
      )}
    </Stack>
  );
}
