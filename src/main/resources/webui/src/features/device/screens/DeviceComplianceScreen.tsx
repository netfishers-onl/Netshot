import { Button, Heading, Stack, Tag, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { AlertBox, DataTable, Protected } from "@/components";
import Icon from "@/components/Icon";
import { useToast } from "@/hooks";
import {
  DeviceComplianceResult,
  DeviceComplianceResultType,
  DeviceSoftwareLevel,
  Level,
} from "@/types";
import { formatDate, getSoftwareLevelColor } from "@/utils";

import DeviceComplianceButton from "../components/DeviceComplianceButton";
import { QUERIES } from "../constants";
import { useDevice } from "../contexts/device";

const columnHelper = createColumnHelper<DeviceComplianceResult>();

export default function DeviceComplianceScreen() {
  const { t } = useTranslation();
  const { device } = useDevice();
  const toast = useToast();
  const params = useParams<{ id: string }>();

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_COMPLIANCE, params?.id],
    queryFn: async () => api.device.getComplianceResultById(+params?.id),
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("policyName", {
        cell: (info) => info.getValue(),
        header: t("Policy"),
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => info.getValue(),
        header: t("Rule"),
      }),
      columnHelper.accessor("result", {
        cell: (info) => {
          const value = info.getValue();

          return (
            <>
              {value === DeviceComplianceResultType.Conforming && (
                <Tag>{t("Compliant")}</Tag>
              )}
              {value === DeviceComplianceResultType.NonConfirming && (
                <Tag colorScheme="red">{t("Non-compliant")}</Tag>
              )}
              {value === DeviceComplianceResultType.Disabled && (
                <Tag colorScheme="grey">{t("Disabled")}</Tag>
              )}
            </>
          );
        },
        header: t("Result"),
      }),
      columnHelper.accessor("comment", {
        cell: (info) => info.getValue(),
        header: t("Details"),
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue() as string) : t("N/A"),
        header: t("Last check"),
      }),
    ],
    [t]
  );

  const softwareLevelColor = useMemo(() => {
    return getSoftwareLevelColor(device?.softwareLevel);
  }, [device?.softwareLevel]);

  return (
    <Stack spacing="6" flex="1">
      <Stack spacing="12">
        <Stack spacing="4">
          <Heading size="md">{t("Software")}</Heading>
          <AlertBox
            type={
              device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN
                ? "error"
                : "success"
            }
          >
            {device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN ? (
              <Text>
                {t(
                  "The software version {{version}} does not conform to the software rules",
                  {
                    version: device?.softwareVersion || t("N/A"),
                  }
                )}
              </Text>
            ) : (
              <Text>
                {t(
                  "The conformance level of the software version for this device is"
                )}{" "}
                <Tag colorScheme={softwareLevelColor}>
                  {device?.softwareLevel}
                </Tag>
              </Text>
            )}
          </AlertBox>
        </Stack>
        <Stack spacing="4">
          <Heading size="md">{t("Hardware")}</Heading>
          <Stack spacing="3">
            <AlertBox type={device?.endOfSale ? "warning" : "success"}>
              {device?.endOfSale ? (
                <Text>
                  {t("End of sale since {{date}} (module {{module}})", {
                    date: formatDate(device?.eosDate, "PPP"),
                    module: device?.eosModule?.partNumber,
                  })}
                </Text>
              ) : (
                <Text>
                  {t("Not end of sale yet")}
                  {device?.eosDate &&
                    t(", planned on {{date}} (module {{module}})", {
                      date: formatDate(device?.eosDate, "PPP"),
                      module: device?.eosModule?.partNumber,
                    })}
                </Text>
              )}
            </AlertBox>
            <AlertBox type={device?.endOfLife ? "warning" : "success"}>
              {device?.endOfLife ? (
                <Text>
                  {t("End of life since {{date}} (module {{module}})", {
                    date: formatDate(device?.eolDate, "PPP"),
                    module: device?.eolModule?.partNumber,
                  })}
                </Text>
              ) : (
                <Text>
                  {t("Not end of life yet")}
                  {device?.eosDate &&
                    t(", planned on {{date}} (module {{module}})", {
                      date: formatDate(device?.eolDate, "PPP"),
                      module: device?.eolModule?.partNumber,
                    })}
                </Text>
              )}
            </AlertBox>
          </Stack>
        </Stack>
        <Stack spacing="4">
          <Heading size="md">{t("Configuration")}</Heading>
          {data?.length > 0 ? (
            <>
              <AlertBox type={device?.compliant ? "success" : "error"}>
                {device?.compliant ? (
                  <Text>{t("The device is compliant with all policies")}</Text>
                ) : (
                  <Text>
                    {t("The device is not in compliance with some policies")}
                  </Text>
                )}
              </AlertBox>
              <DataTable columns={columns} data={data} loading={isPending} />
            </>
          ) : (
            <Text>{t("There is no compliance result for this device")}</Text>
          )}
        </Stack>
        <Protected minLevel={Level.Operator}>
          <DeviceComplianceButton
            devices={[device]}
            renderItem={(open) => (
              <Button
                alignSelf="start"
                leftIcon={<Icon name="play" />}
                variant="primary"
                onClick={open}
              >
                {t("Check compliance")}
              </Button>
            )}
          />
        </Protected>
      </Stack>
    </Stack>
  );
}
