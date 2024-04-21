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
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type DeviceDiagnosticButtonProps = {
  device: Device;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

type Form = {
  checkCompliance: boolean;
} & ScheduleFormType;

export default function DeviceDiagnosticButton(
  props: DeviceDiagnosticButtonProps
) {
  const { device, renderItem } = props;
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

      const task = await mutation.mutateAsync({
        type: TaskType.RunDiagnostic,
        device: device?.id,
        debugEnabled: false,
        dontRunDiagnostics: true,
        dontCheckCompliance: !data.checkCompliance,
        ...schedule,
      });

      dialog.close();
      setTaskId(task.id);
      disclosure.onOpen();
    },
    [device, mutation, disclosure]
  );

  const dialog = Dialog.useForm({
    title: t("Run device diagnostics"),
    description: (
      <FormProvider {...form}>
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
