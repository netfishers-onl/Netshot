import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import ScheduleForm, { ScheduleFormType } from "@/components/ScheduleForm";
import TaskDialog from "@/components/TaskDialog";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Device, SimpleDevice, Task, TaskType } from "@/types";
import { Box, Flex, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { MouseEvent, ReactElement, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type DeviceComplianceButtonProps = {
  devices: SimpleDevice[] | Device[];
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function DeviceComplianceButton(
  props: DeviceComplianceButtonProps
) {
  const { devices, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);

  const form = useForm<ScheduleFormType>({
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: api.task.create,
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (data: ScheduleFormType) => {
      const { schedule } = data;
      const tasks: Task[] = [];

      for (const device of devices) {
        const task = await mutation.mutateAsync({
          type: TaskType.RunDiagnostic,
          device: device?.id,
          debugEnabled: false,
          dontRunDiagnostics: true,
          dontCheckCompliance: true,
          ...schedule,
        });

        tasks.push(task);
      }

      dialog.close();

      if (tasks.length === 1) {
        setTaskId(tasks[0].id);
        disclosure.onOpen();
      }
    },
    [mutation, devices, disclosure]
  );

  const dialog = Dialog.useForm({
    title: t("Run device compliance"),
    description: (
      <Stack spacing="6">
        <Stack spacing="3">
          {devices.length > 1 ? (
            <>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("Devices")}</Text>
                </Box>
                <Text>{devices.map((device) => device.name).join(", ")}</Text>
              </Flex>
            </>
          ) : (
            <>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("Name")}</Text>
                </Box>
                <Text>{devices?.[0]?.name ?? "N/A"}</Text>
              </Flex>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("IP Address")}</Text>
                </Box>
                <Text>{devices?.[0]?.mgmtAddress ?? "N/A"}</Text>
              </Flex>
            </>
          )}
        </Stack>
        <ScheduleForm />
      </Stack>
    ),
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    onSubmit,
    submitButton: {
      label: t("Run"),
    },
  }, [devices]);

  return (
    <>
      {renderItem(dialog.open)}
      {taskId && <TaskDialog id={taskId} {...disclosure} />}
    </>
  );
}
