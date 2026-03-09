import { TaskStatus } from "@/types";
import { Steps, Spinner, Stack, Tag, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export type TaskStatusTagProps = {
  status: TaskStatus;
};

export default function TaskStatusTag(props: TaskStatusTagProps) {
  const { status } = props;
  const { t } = useTranslation();

  if (status === TaskStatus.Scheduled) {
    return <Tag.Root colorPalette="yellow">{t("Scheduled")}</Tag.Root>;
  } else if (status === TaskStatus.Running) {
    return (
      <Stack direction="row" alignItems="center" gap="3">
        <Spinner size="sm" />
        <Text>{t("Running")}</Text>
      </Stack>
    );
  } else if (status === TaskStatus.Failure) {
    return <Tag.Root colorPalette="red">{t("Failure")}</Tag.Root>;
  } else if (status === TaskStatus.Cancelled) {
    return <Tag.Root colorPalette="grey">{t("Cancelled")}</Tag.Root>;
  } else if (status === TaskStatus.Success) {
    return <Tag.Root colorPalette="green">{t("Success")}</Tag.Root>;
  } else if (status === TaskStatus.Waiting) {
    return <Tag.Root colorPalette="grey">{t("Waiting")}</Tag.Root>;
  } else if (status === TaskStatus.New) {
    return <Tag.Root colorPalette="grey">{t("New")}</Tag.Root>;
  } else {
    return <Tag.Root colorPalette="grey">{t("Unknown")}</Tag.Root>;
  }
}
