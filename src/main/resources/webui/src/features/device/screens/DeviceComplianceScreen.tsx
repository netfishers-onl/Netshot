import { Button, Heading, Stack, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import api from "@/api"
import { AlertBox, DataTable, Protected } from "@/components"
import Icon from "@/components/Icon"
import {
  DeviceComplianceResult,
  DeviceComplianceResultType,
  DeviceSoftwareLevel,
  Level,
} from "@/types"
import { formatDate, getSoftwareLevelColor } from "@/utils"

import DeviceComplianceButton from "../components/DeviceComplianceButton"
import { QUERIES } from "../constants"
import { useDevice } from "../contexts/device"

const columnHelper = createColumnHelper<DeviceComplianceResult>()

export default function DeviceComplianceScreen() {
  const { t } = useTranslation()
  const { device } = useDevice()
  const params = useParams<{ id: string }>()

  const { data = [], isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_COMPLIANCE, params?.id],
    queryFn: async () => api.device.getComplianceResultById(+params?.id),
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor("policyName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Policy"),
        enableSorting: true,
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Rule"),
        enableSorting: true,
      }),
      columnHelper.accessor("result", {
        cell: (info) => {
          const value = info.getValue()
          return (
            <>
              {value === DeviceComplianceResultType.Conforming && (
                <Tag.Root>{t("Compliant")}</Tag.Root>
              )}
              {value === DeviceComplianceResultType.NonConfirming && (
                <Tag.Root colorPalette="red">{t("Non-compliant")}</Tag.Root>
              )}
              {value === DeviceComplianceResultType.Disabled && (
                <Tag.Root colorPalette="grey">{t("Disabled")}</Tag.Root>
              )}
            </>
          )
        },
        header: t("Result"),
        enableSorting: true,
      }),
      columnHelper.accessor("comment", {
        cell: (info) => <Text>{info.getValue()}</Text>,
        header: t("Details"),
        enableSorting: true,
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) => <Text>{info.getValue() ? formatDate(info.getValue()) : t("N/A")}</Text>,
        header: t("Last check"),
        enableSorting: true,
      }),
    ],
    [t]
  )

  const softwareLevelColor = useMemo(() => {
    return getSoftwareLevelColor(device?.softwareLevel)
  }, [device?.softwareLevel])

  return (
    <Stack gap="6" flex="1">
      <Stack gap="12">
        <Stack gap="4">
          <Heading size="md">{t("Software")}</Heading>
          <AlertBox
            type={device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN ? "error" : "success"}
          >
            {device?.softwareLevel === DeviceSoftwareLevel.UNKNOWN ? (
              <Text>
                {t("The software version {{version}} does not conform to the software rules", {
                  version: device?.softwareVersion || t("N/A"),
                })}
              </Text>
            ) : (
              <Text>
                {t("The conformance level of the software version for this device is")}{" "}
                <Tag.Root as="span" colorPalette={softwareLevelColor}>
                  {device?.softwareLevel}
                </Tag.Root>
              </Text>
            )}
          </AlertBox>
        </Stack>
        <Stack gap="4">
          <Heading size="md">{t("Hardware")}</Heading>
          <Stack gap="3" direction="row">
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
        <Stack gap="4">
          <Heading size="md">{t("Configuration")}</Heading>
          {data?.length > 0 ? (
            <>
              <AlertBox type={device?.compliant ? "success" : "error"}>
                {device?.compliant ? (
                  <Text>{t("The device is compliant with all policies")}</Text>
                ) : (
                  <Text>{t("The device is not in compliance with some policies")}</Text>
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
              <Button alignSelf="start" variant="primary" onClick={open}>
                <Icon name="checkCircle" />
                {t("Check compliance")}
              </Button>
            )}
          />
        </Protected>
      </Stack>
    </Stack>
  )
}
