import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Checkbox } from "@/components";
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

export type DeviceSnapshotButtonProps = {
  devices: SimpleDevice[] | Device[];
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

type SnapshotForm = {
  runDiagnostic: boolean;
  checkCompliance: boolean;
  debugEnabled: boolean;
} & ScheduleFormType;

export default function DeviceSnapshotButton(props: DeviceSnapshotButtonProps) {
  const { devices, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);

  const form = useForm<SnapshotForm>({
    mode: "onChange",
    defaultValues: {
      runDiagnostic: true,
      checkCompliance: true,
      debugEnabled: false,
    },
  });

  const mutation = useMutation({
    mutationFn: api.task.create,
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: SnapshotForm) => {
      const { schedule } = values;
      const tasks: Task[] = [];

      for (const device of devices) {
        const task = await mutation.mutateAsync({
          type: TaskType.TakeSnapshot,
          device: device?.id,
          debugEnabled: values.debugEnabled,
          dontRunDiagnostics: !values.runDiagnostic,
          dontCheckCompliance: !values.checkCompliance,
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
    [devices, mutation, disclosure]
  );

  const dialog = Dialog.useForm({
    title: t("Take device snapshot"),
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
        <Stack spacing="3">
          <Checkbox control={form.control} name="runDiagnostic">
            {t("Run the device diagnostics after the snapshot")}
          </Checkbox>
          <Checkbox control={form.control} name="checkCompliance">
            {t("Check device compliance after the snapshot")}
          </Checkbox>
          <Checkbox control={form.control} name="debugEnabled">
            {t(
              "Enable full debug of the CLI session (only for the troubleshooting"
            )}
          </Checkbox>
        </Stack>
        <ScheduleForm />
      </Stack>
    ),
    form,
    isLoading: mutation.isPending,
    size: "2xl",
    onSubmit,
    submitButton: {
      label: t("Take snapshot"),
    },
  });

  return (
    <>
      {renderItem(dialog.open)}
      {taskId && <TaskDialog id={taskId} {...disclosure} />}
    </>
  );
}
