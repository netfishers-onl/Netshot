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
          label={t("Configuration changes")}
          description={t("Track last configuration changes or over a period")}
        />
        <SidebarLink
          to="./device-access-failure"
          label={t("Device access failures")}
          description={t("Devices unreachable for a few days")}
        />
        <SidebarLink
          to="./configuration-compliance"
          label={t("Configuration compliance")}
          description={t("Compliance status of the device configurations")}
        />
        <SidebarLink
          to="./software-compliance"
          label={t("Software compliance")}
          description={t("Compliance status of the device software versions")}
        />
        <SidebarLink
          to="./hardware-support-status"
          label={t("Hardware support status")}
          description={t("End of sale / life milestones")}
        />
      </Stack>
      <Separator />
      <Stack py="4" px="5">
        <ExportDataButton
          renderItem={(open) => (
            <Button onClick={open}><Icon name="download" />{t("Export data")}</Button>
          )}
        />
      </Stack>
    </Sidebar>
  );
}
