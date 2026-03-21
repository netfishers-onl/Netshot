import { Icon, Sidebar, SidebarLink } from "@/components";
import { Steps, Button, Stack, Separator } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import ExportDataButton from "./ExportDataButton";

export default function ReportSidebar() {
  const { t } = useTranslation();

  return (
    <Sidebar>
      <Stack gap="0" py="4" px="5" flex="1">
        <SidebarLink
          to="./configuration-change"
          label={t("configurationChanges")}
          description={t("trackLastConfigurationChangesOrOverAPeriod")}
        />
        <SidebarLink
          to="./device-access-failure"
          label={t("deviceAccessFailures")}
          description={t("devicesUnreachableForAFewDays")}
        />
        <SidebarLink
          to="./configuration-compliance"
          label={t("configurationCompliance")}
          description={t("complianceStatusOfTheDeviceConfigurations")}
        />
        <SidebarLink
          to="./software-compliance"
          label={t("softwareCompliance")}
          description={t("complianceStatusOfTheDeviceSoftwareVersions")}
        />
        <SidebarLink
          to="./hardware-support-status"
          label={t("hardwareSupportStatus")}
          description={t("endOfSaleLifeMilestones")}
        />
      </Stack>
      <Separator />
      <Stack py="4" px="5">
        <ExportDataButton
          renderItem={(open) => (
            <Button onClick={open}><Icon name="download" />{t("exportData")}</Button>
          )}
        />
      </Stack>
    </Sidebar>
  );
}
