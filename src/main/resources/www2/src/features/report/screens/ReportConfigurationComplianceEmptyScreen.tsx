import { AddGroupButton, EmptyResult, Icon } from "@/components";
import { Button, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export default function ReportConfigurationComplianceEmptyScreen() {
  const { t } = useTranslation();

  return (
    <Stack flex="1" alignItems="center" justifyContent="center">
      <EmptyResult title={t('Select group to begin')} description={t('Here, you can visualize compliant status for devices into groups')}>
        <AddGroupButton renderItem={open => (
          <Button onClick={open} leftIcon={<Icon name="plus" />}>{t('Create group')}</Button>
        )} />
      </EmptyResult>
    </Stack>
  )
}