import Icon from "@/components/Icon";
import { useDeviceTypeOptions, useToast } from "@/hooks";
import { DeviceConfig, DeviceTypeAttribute } from "@/types";
import { formatDate } from "@/utils";
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
import { useParams } from "react-router-dom";
import { useDevice } from "../contexts/DeviceProvider";
import DeviceConfigurationAttribute from "./DeviceConfigurationAttribute";
import DeviceConfigurationCompareButton from "./DeviceConfigurationCompareButton";

export type DeviceConfigurationPanelProps = {
  config: DeviceConfig;
};

export default function DeviceConfigurationPanel(
  props: DeviceConfigurationPanelProps
) {
  const { config } = props;
  const { t } = useTranslation();
  const controls = useAnimationControls();
  const toast = useToast();
  const { device } = useDevice();
  const params = useParams<{ id: string }>();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [attributes, setAttributes] = useState<DeviceTypeAttribute[]>([]);

  const { isLoading, getOptionByDriver } = useDeviceTypeOptions({
    withAny: false,
    onSuccess(options) {
      const driver = options.find(
        (option) => option.value?.name === device.driver
      );

      if (!driver) {
        return;
      }

      setAttributes(
        driver.value.attributes.filter((attribute) => attribute.checkable)
      );
    },
  });

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
              {attributes?.map((attribute) => (
                <DeviceConfigurationAttribute
                  key={attribute?.name}
                  config={config}
                  attribute={attribute}
                />
              ))}
            </>
          )}
        </Stack>
      </motion.div>
    </Stack>
  );
}
