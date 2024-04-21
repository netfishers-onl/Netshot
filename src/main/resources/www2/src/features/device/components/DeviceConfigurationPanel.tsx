import Icon from "@/components/Icon";
import { useToast } from "@/hooks";
import { DeviceConfig } from "@/types";
import { downloadFromUrl } from "@/utils";
import {
  Button,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { motion, useAnimationControls } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import DeviceConfigurationCompareButton from "./DeviceConfigurationCompareButton";
import DeviceConfigurationViewButton from "./DeviceConfigurationViewButton";

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
  const params = useParams<{ id: string }>();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const changeDate = useMemo(() => {
    return format(new Date(config?.changeDate), "yyyy-MM-dd");
  }, [config]);

  const downloadAdminConfiguration = useCallback(async () => {
    try {
      await downloadFromUrl(`/api/configs/${config?.id}/adminConfiguration`);
    } catch (err) {
      toast.error({
        title: t("Download error"),
        description: t("An error occurred during the file download"),
      });
    }
  }, [config]);

  const downloadConfiguration = useCallback(async () => {
    try {
      await downloadFromUrl(`/api/configs/${config?.id}/configuration`);
    } catch (err) {
      toast.error({
        title: t("Download error"),
        description: t("An error occurred during the file download"),
      });
    }
  }, [config]);

  const downloadXRPackage = useCallback(async () => {
    try {
      await downloadFromUrl(`/api/configs/${config?.id}/xrPackages`);
    } catch (err) {
      toast.error({
        title: t("Download error"),
        description: t("An error occurred during the file download"),
      });
    }
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
        <Tag colorScheme="green">{config?.author}</Tag>
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
        <Stack direction="row" spacing="3" p="6">
          <Menu>
            <MenuButton as={Button}>{t("Admin configuration")}</MenuButton>
            <MenuList>
              <DeviceConfigurationViewButton
                id={config?.id}
                type="adminConfiguration"
                renderItem={(open) => (
                  <MenuItem onClick={open} icon={<Icon name="eye" />}>
                    {t("View")}
                  </MenuItem>
                )}
              />

              <MenuItem
                icon={<Icon name="download" />}
                onClick={downloadAdminConfiguration}
              >
                {t("Download")}
              </MenuItem>
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button}>{t("Configuration")}</MenuButton>
            <MenuList>
              <DeviceConfigurationViewButton
                id={config?.id}
                type="configuration"
                renderItem={(open) => (
                  <MenuItem onClick={open} icon={<Icon name="eye" />}>
                    {t("View")}
                  </MenuItem>
                )}
              />

              <MenuItem
                icon={<Icon name="download" />}
                onClick={downloadConfiguration}
              >
                {t("Download")}
              </MenuItem>
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button}>{t("XR packages")}</MenuButton>
            <MenuList>
              <DeviceConfigurationViewButton
                id={config?.id}
                type="xrPackages"
                renderItem={(open) => (
                  <MenuItem onClick={open} icon={<Icon name="eye" />}>
                    {t("View")}
                  </MenuItem>
                )}
              />
              <MenuItem
                icon={<Icon name="download" />}
                onClick={downloadXRPackage}
              >
                {t("Download")}
              </MenuItem>
            </MenuList>
          </Menu>
        </Stack>
      </motion.div>
    </Stack>
  );
}
