import {
  Divider,
  IconButton,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { motion, useAnimationControls } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import Icon from "@/components/Icon";
import { useDeviceTypeOptions, useToast } from "@/hooks";
import { DeviceConfig, DeviceAttributeDefinition, Config, ConfigNumericAttribute, ConfigTextAttribute, ConfigBinaryAttribute, ConfigAttribute, DeviceAttributeType, DeviceAttributeLevel } from "@/types";
import { formatDate } from "@/utils";

import { useDevice } from "../contexts/device";
import DeviceConfigurationAttribute from "./DeviceConfigurationAttribute";
import DeviceConfigurationCompareButton from "./DeviceConfigurationCompareButton";






export type DeviceConfigurationPanelProps = {
  config: Config;
};

export default function DeviceConfigurationPanel(
  props: DeviceConfigurationPanelProps
) {
  const { config } = props;
  const { t } = useTranslation();
  const controls = useAnimationControls();
  const { type, isLoading } = useDevice();
  const params = useParams<{ id: string }>();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const attributeDefinitions = useMemo<DeviceAttributeDefinition[]>(() => {
    return type?.attributes.filter(a => a.level === DeviceAttributeLevel.Config);
  }, [type]);

  const changeDate = useMemo(() => {
    return formatDate(config?.changeDate);
  }, [config]);

  const toggleCollapse = useCallback(async () => {
    setIsCollapsed((prev) => !prev);
    await controls.start(isCollapsed ? "show" : "hidden");
  }, [controls, isCollapsed]);

  return (
    <Stack
      borderWidth="1px"
      borderColor="grey.100"
      borderRadius="2xl"
      key={config.id}
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
          {changeDate}
        </Text>
        {config?.author && <Tag colorScheme="grey">{config?.author}</Tag>}

        <Spacer />
        <DeviceConfigurationCompareButton config={config} id={+params?.id} />
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
        <Stack direction="column" spacing="3" p="6">
          {isLoading ? (
            <>
              <Skeleton w="80px" h="40px" />
              <Skeleton w="80px" h="40px" />
              <Skeleton w="80px" h="40px" />
            </>
          ) : (
            <>
              {attributeDefinitions?.map((attrDef) => (
                <DeviceConfigurationAttribute
                  key={attrDef?.name}
                  config={config}
                  definition={attrDef}
                />
              ))}
            </>
          )}
        </Stack>
      </motion.div>
    </Stack>
  );
}
