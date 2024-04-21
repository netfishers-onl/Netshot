import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { Checkbox } from "@/components";
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

export type DeviceSnapshotButtonProps = {
  device: Device;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

type SnapshotForm = {
  runDiagnostic: boolean;
  checkCompliance: boolean;
  debugEnabled: boolean;
} & ScheduleFormType;

export default function DeviceSnapshotButton(props: DeviceSnapshotButtonProps) {
  const { device, renderItem } = props;
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

  const mutation = useMutation(api.task.create, {
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: SnapshotForm) => {
      const { schedule } = values;

      const task = await mutation.mutateAsync({
        type: TaskType.TakeSnapshot,
        device: device?.id,
        debugEnabled: values.debugEnabled,
        dontRunDiagnostics: !values.runDiagnostic,
        dontCheckCompliance: !values.checkCompliance,
        ...schedule,
      });

      dialog.close();
      setTaskId(task.id);
      disclosure.onOpen();
    },
    [device, mutation, disclosure]
  );

  const dialog = Dialog.useForm({
    title: t("Take device snapshot"),
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
    isLoading: mutation.isLoading,
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
