import { TaskStatus } from "@/types";
import { Spinner, Stack, Tag, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export type TaskStatusTagProps = {
  status: TaskStatus;
};

export default function TaskStatusTag(props: TaskStatusTagProps) {
  const { status } = props;
  const { t } = useTranslation();

  if (status === TaskStatus.Scheduled) {
    return <Tag colorScheme="yellow">{t("Scheduled")}</Tag>;
  } else if (status === TaskStatus.Running) {
    return (
      <Stack direction="row" alignItems="center" spacing="3">
        <Spinner size="sm" />
        <Text>{t("Running")}</Text>
      </Stack>
    );
  } else if (status === TaskStatus.Failure) {
    return <Tag colorScheme="red">{t("Failure")}</Tag>;
  } else if (status === TaskStatus.Cancelled) {
    return <Tag colorScheme="grey">{t("Cancelled")}</Tag>;
  } else if (status === TaskStatus.Success) {
    return <Tag colorScheme="green">{t("Success")}</Tag>;
  } else if (status === TaskStatus.Waiting) {
    return <Tag colorScheme="grey">{t("Waiting")}</Tag>;
  } else if (status === TaskStatus.New) {
    return <Tag colorScheme="grey">{t("New")}</Tag>;
  } else {
    return <Tag colorScheme="grey">{t("Unknown")}</Tag>;
  }
}
