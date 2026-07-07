import { Sidebar as SidebarLayout, SidebarLink } from "@/components";
import { LuDownload } from "react-icons/lu";
import { Steps, Button, Stack, Separator } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import ExportDataTrigger from "./ExportDataTrigger";

export default function ReportSidebar() {
  const { t } = useTranslation();

  return (
    <SidebarLayout>
      <Stack gap="0" py="4" px="5" flex="1">
        <SidebarLink
          to="./configuration-change"
          label={t("device.config.changes")}
          description={t("device.config.trackChanges")}
        />
        <SidebarLink
          to="./device-access-failure"
          label={t("device.accessFailures")}
          description={t("device.unreachableForFewDays")}
        />
        <SidebarLink
          to="./configuration-compliance"
          label={t("device.config.compliance")}
          description={t("device.config.complianceStatusDesc")}
        />
        <SidebarLink
          to="./software-compliance"
          label={t("compliance.software.label")}
          description={t("compliance.software.versionStatusDesc")}
        />
        <SidebarLink
          to="./hardware-support-status"
          label={t("compliance.hardware.supportStatus")}
          description={t("compliance.hardware.endOfSaleLifeMilestones")}
        />
      </Stack>
      <Separator />
      <Stack py="4" px="5">
        <ExportDataTrigger>
          <Button><LuDownload />{t("common.exportData")}</Button>
        </ExportDataTrigger>
      </Stack>
    </SidebarLayout>
  );
}
