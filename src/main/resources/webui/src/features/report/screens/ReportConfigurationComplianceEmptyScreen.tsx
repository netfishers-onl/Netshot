import { AddGroupButton, EmptyResult, Icon } from "@/components";
import { Button, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export default function ReportConfigurationComplianceEmptyScreen() {
  const { t } = useTranslation();

  return (
    <Stack flex="1" alignItems="center" justifyContent="center">
      <EmptyResult
        title={t('Select group to begin')}
        description={t('Here, you can visualize device compliance status per group')}
      />
    </Stack>
  )
}