import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import ScheduleForm, { ScheduleFormType } from "@/components/ScheduleForm";
import TaskDialog from "@/components/TaskDialog";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Device, TaskType } from "@/types";
import { Box, Flex, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type DeviceComplianceButtonProps = {
  device: Device;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DeviceComplianceButton(
  props: DeviceComplianceButtonProps
) {
  const { device, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);

  const form = useForm<ScheduleFormType>({
    mode: "onChange",
  });

  const mutation = useMutation(api.task.create, {
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (data: ScheduleFormType) => {
      const { schedule } = data;

      const task = await mutation.mutateAsync({
        type: TaskType.RunDiagnostic,
        device: device?.id,
        debugEnabled: false,
        dontRunDiagnostics: true,
        dontCheckCompliance: true,
        ...schedule,
      });

      dialog.close();
      setTaskId(task.id);
      disclosure.onOpen();
    },
    [mutation, device, disclosure]
  );

  const dialog = Dialog.useForm({
    title: t("Run device compliance"),
    description: (
      <Stack spacing="6">
        <Stack spacing="3">
          <Flex alignItems="center">
            <Box w="140px">
              <Text color="grey.400">{t("Name")}</Text>
            </Box>
            <Text>{device?.name ?? "N/A"}</Text>
          </Flex>
          <Flex alignItems="center">
            <Box w="140px">
              <Text color="grey.400">{t("IP Address")}</Text>
            </Box>
            <Text>{device?.mgmtAddress ?? "N/A"}</Text>
          </Flex>
        </Stack>
        <ScheduleForm />
      </Stack>
    ),
    form,
    isLoading: mutation.isLoading,
    size: "2xl",
    onSubmit,
    submitButton: {
      label: t("Run"),
    },
  });

  return (
    <>
      {renderItem(dialog.open)}
      {taskId && <TaskDialog id={taskId} {...disclosure} />}
    </>
  );
}
