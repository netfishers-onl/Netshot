import { Heading, Stack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  ReportConfigurationChangeList,
  ReportConfigurationChart,
} from "../components";

export default function ReportConfigurationChangeScreen() {
  const { t } = useTranslation();

  return (
    <Stack spacing="8" p="9" flex="1" overflow="auto">
      <Stack direction="row">
        <Heading as="h1" fontSize="4xl">
          {t("Configuration changes")}
        </Heading>
      </Stack>
      <ReportConfigurationChart />
      <ReportConfigurationChangeList />
    </Stack>
  );
}
