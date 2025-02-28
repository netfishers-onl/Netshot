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
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type DeviceDiagnosticButtonProps = {
  devices: SimpleDevice[] | Device[];
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

type Form = {
  checkCompliance: boolean;
} & ScheduleFormType;

export default function DeviceDiagnosticButton(
  props: DeviceDiagnosticButtonProps
) {
  const { devices, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);

  const form = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      checkCompliance: true,
    },
  });

  const mutation = useMutation(api.task.create, {
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (data: Form) => {
      const { schedule } = data;
      const tasks: Task[] = [];

      for (const device of devices) {
        const task = await mutation.mutateAsync({
          type: TaskType.RunDiagnostic,
          device: device?.id,
          debugEnabled: false,
          dontRunDiagnostics: true,
          dontCheckCompliance: !data.checkCompliance,
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
    title: t("Run device diagnostics"),
    description: (
      <FormProvider {...form}>
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
            <Checkbox control={form.control} name="checkCompliance">
              {t("Check device compliance after the snapshot")}
            </Checkbox>
          </Stack>
          <ScheduleForm />
        </Stack>
      </FormProvider>
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
