import { SidebarLink } from "@/components";
import { Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <Stack w="300px" overflow="auto" spacing="0">
      <Stack spacing="0" py="4" px="5" flex="1">
        <SidebarLink
          to="./user"
          label={t("Users")}
          description={t("Manage user permissions")}
        />
        <SidebarLink
          to="./device-domain"
          label={t("Device domains")}
          description={t("Manage IP address for devices")}
        />
        <SidebarLink
          to="./device-credential"
          label={t("Device credentials")}
          description={t("Manage credentials for devices")}
        />
        <SidebarLink
          to="./driver"
          label={t("Drivers")}
          description={t("Manage device type")}
        />
        <SidebarLink
          to="./api-token"
          label={t("API tokens")}
          description={t("Connect with an external app")}
        />
        <SidebarLink
          to="./webhook"
          label={t("Webhooks")}
          description={t("Execute an external function")}
        />
        <SidebarLink
          to="./clustering"
          label={t("Clustering")}
          description={t("Manage a clustered server architecture")}
        />
      </Stack>
    </Stack>
  );
}
