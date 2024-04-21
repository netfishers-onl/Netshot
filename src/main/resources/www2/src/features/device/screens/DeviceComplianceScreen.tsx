import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, Protected } from "@/components";
import Icon from "@/components/Icon";
import { useToast } from "@/hooks";
import {
  DeviceComplianceResult,
  DeviceComplianceResultType,
  DeviceSoftwareLevel,
  Level,
} from "@/types";
import { formatDate, getSoftwareLevelColor } from "@/utils";
import { Button, Flex, Heading, Stack, Tag, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { PropsWithChildren, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import DeviceComplianceButton from "../components/DeviceComplianceButton";
import { QUERIES } from "../constants";
import { useDevice } from "../contexts/DeviceProvider";

type AlertBoxProps = {
  type: "success" | "error" | "warning";
};

function AlertBox(props: PropsWithChildren<AlertBoxProps>) {
  const { children, type } = props;

  const icon = useMemo(() => {
    let bg: string;

    if (type === "error") {
      bg = "red.50";
    } else if (type === "warning") {
      bg = "yellow.50";
    } else if (type === "success") {
      bg = "green.50";
    }

    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        w="32px"
        h="32px"
        bg={bg}
        borderRadius="full"
      >
        {type === "error" && <Icon name="x" color="red.800" />}
        {type === "success" && <Icon name="check" color="green.800" />}
        {type === "warning" && <Icon name="alertTriangle" color="yellow.800" />}
      </Flex>
    );
  }, [type]);

  return (
    <Stack
      direction="row"
      spacing="3"
      borderWidth="1px"
      borderColor="grey.100"
      borderRadius="2xl"
      alignSelf="start"
      py="4"
      px="5"
      alignItems="center"
    >
      {icon}
      {children}
    </Stack>
  );
}

const columnHelper = createColumnHelper<DeviceComplianceResult>();

export default function DeviceComplianceScreen() {
  const { t } = useTranslation();
  const { device } = useDevice();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const { data = [], isLoading } = useQuery(
    [QUERIES.DEVICE_COMPLIANCE, params?.id],
    async () => api.device.getComplianceResultById(+params?.id),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

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
              <DataTable columns={columns} data={data} loading={isLoading} />
            </>
          ) : (
            <Text>{t("There is no compliance result for this device")}</Text>
          )}
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
        <Protected
          roles={[Level.Admin, Level.Operator, Level.ReadWriteCommandOnDevice]}
        >
          <DeviceComplianceButton
            device={device}
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
