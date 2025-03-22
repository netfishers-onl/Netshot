import { DataTable } from "@/components";
import Icon from "@/components/Icon";
import { ConfigComplianceDeviceStatus } from "@/types";
import { formatDate } from "@/utils";
import {
  Button,
  Divider,
  IconButton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { motion, useAnimationControls } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export type DeviceConfigurationPanelProps = {
  name: string;
  configs: ConfigComplianceDeviceStatus[];
};

const columnHelper = createColumnHelper<ConfigComplianceDeviceStatus>();

export default function DeviceConfigurationCompliancePanel(
  props: DeviceConfigurationPanelProps
) {
  const { name, configs } = props;
  const { t } = useTranslation();
  const controls = useAnimationControls();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const toggleCollapse = useCallback(async () => {
    setIsCollapsed((prev) => !prev);
    await controls.start(isCollapsed ? "show" : "hidden");
  }, [controls, isCollapsed]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("configCompliant", {
        cell: (info) => {
          const value = info.getValue();

          if (value) {
            return (
              <Tag bg="green.50" color="green.900">
                {t("Compliant")}
              </Tag>
            );
          }

          return (
            <Tag bg="green.900" color="green.50">
              {t("Non compliant")}
            </Tag>
          );
        },
        header: t("Status"),
      }),
      columnHelper.accessor("policyName", {
        cell: (info) => info.getValue(),
        header: t("Policy"),
      }),
      columnHelper.accessor("ruleName", {
        cell: (info) => info.getValue(),
        header: t("Rule"),
      }),
      columnHelper.accessor("checkDate", {
        cell: (info) =>
          info.getValue() ? formatDate(info.getValue()) : t("N/A"),
        header: t("Test date/time"),
      }),
    ],
    [t]
  );

  return (
    <Stack
      borderWidth="1px"
      borderColor="grey.100"
      borderRadius="2xl"
      key={name}
      spacing="0"
    >
      <Stack
        direction="row"
        spacing="3"
        alignItems="center"
        p="3"
        onClick={toggleCollapse}
        cursor="pointer"
      >
        <IconButton
          variant="ghost"
          colorScheme="green"
          icon={<Icon name="chevronDown" />}
          aria-label={t("Open")}
          sx={{
            transform: isCollapsed ? "rotate(-90deg)" : "",
          }}
        />
        <Text fontSize="md" fontWeight="semibold">
          {name}
        </Text>

        <Spacer />
        <Button
          colorScheme="green"
          variant="ghost"
          as={Link}
          to={`/app/devices/${configs?.[0]?.id}/compliance`}
        >
          {t("See details")}
        </Button>
      </Stack>

      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, height: 0, pointerEvents: "none" },
          show: {
            opacity: 1,
            height: "auto",
            pointerEvents: "all",
          },
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <Divider />
        <Stack direction="column" spacing="3" pb="1">
          <DataTable
            columns={columns}
            data={configs}
            border="none"
            borderRadius="0"
          />
        </Stack>
      </motion.div>
    </Stack>
  );
}
