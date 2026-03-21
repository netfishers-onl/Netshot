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
    return <Tag.Root colorPalette="yellow">{t("scheduled")}</Tag.Root>;
  } else if (status === TaskStatus.Running) {
    return (
      <Stack direction="row" alignItems="center" gap="3">
        <Spinner size="sm" />
        <Text>{t("running")}</Text>
      </Stack>
    );
  } else if (status === TaskStatus.Failure) {
    return <Tag.Root colorPalette="red">{t("failure")}</Tag.Root>;
  } else if (status === TaskStatus.Cancelled) {
    return <Tag.Root colorPalette="grey">{t("cancelled")}</Tag.Root>;
  } else if (status === TaskStatus.Success) {
    return <Tag.Root colorPalette="green">{t("success")}</Tag.Root>;
  } else if (status === TaskStatus.Waiting) {
    return <Tag.Root colorPalette="grey">{t("waiting")}</Tag.Root>;
  } else if (status === TaskStatus.New) {
    return <Tag.Root colorPalette="grey">{t("new")}</Tag.Root>;
  } else {
    return <Tag.Root colorPalette="grey">{t("unknown3")}</Tag.Root>;
  }
}
