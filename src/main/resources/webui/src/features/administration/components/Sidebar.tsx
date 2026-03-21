import { SidebarLink } from "@/components";
import { Steps, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <Stack w="300px" overflow="auto" gap="0">
      <Stack gap="0" py="4" px="5" flex="1">
        <SidebarLink
          to="./user"
          label={t("users")}
          description={t("manageUserPermissions")}
        />
        <SidebarLink
          to="./device-domain"
          label={t("deviceDomains")}
          description={t("manageIpAddressForDevices")}
        />
        <SidebarLink
          to="./device-credential"
          label={t("deviceCredentials")}
          description={t("manageCredentialsForDevices")}
        />
        <SidebarLink
          to="./driver"
          label={t("drivers")}
          description={t("manageDeviceType")}
        />
        <SidebarLink
          to="./api-token"
          label={t("apiTokens")}
          description={t("connectWithAnExternalApp")}
        />
        <SidebarLink
          to="./webhook"
          label={t("webhooks")}
          description={t("executeAnExternalFunction")}
        />
        <SidebarLink
          to="./clustering"
          label={t("clustering")}
          description={t("manageAClusteredServerArchitecture")}
        />
      </Stack>
    </Stack>
  );
}
