import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { FormControl, Icon, ScheduleForm } from "@/components";
import { ScheduleFormType } from "@/components/ScheduleForm";
import TaskDialog from "@/components/TaskDialog";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Device, Script, SimpleDevice, Task, TaskType } from "@/types";
import {
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

type RunScriptFormProps = {
  script: Script;
  driver: string;
  devices: SimpleDevice[] | Device[];
};

function RunScriptForm(props: RunScriptFormProps) {
  const { script, driver, devices } = props;

  const { t } = useTranslation();
  const toast = useToast();
  const form = useFormContext();

  // Validate script before submitting and retrieve user inputs if exist
  const { data: validatedScript, isLoading } = useQuery(
    [QUERIES.SCRIPT_VALIDATE, script?.script, driver],
    async () =>
      api.script.validate({
        deviceDriver: driver,
        name: "#",
        script: script?.script,
      }),
    {
      onSuccess(data) {
        // Prepare dynamic form with script user inputs
        const userInputs = {};

        for (const item in data.userInputDefinitions) {
          userInputs[data.userInputDefinitions[item].name] = "";
        }

        form.setValue("userInputs", userInputs);
      },
      onError(err: NetshotError) {
        toast.error(err);
      },
    }
  );

  // Transform object to array to render the controls
  const inputs = useMemo(() => {
    if (!validatedScript?.userInputDefinitions) {
      return [];
    }

    return Object.keys(validatedScript?.userInputDefinitions).map((key) => {
      return validatedScript?.userInputDefinitions[key];
    });
  }, [validatedScript]);

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Stack spacing="6">
      <Stack spacing="3">
        <Flex alignItems="center">
          <Box w="140px">
            <Text color="grey.400">
              {t(devices.length > 1 ? "Devices" : "Device")}
            </Text>
          </Box>
          <Text>
            {devices.length > 1
              ? devices.map((device) => device.name).join(", ")
              : devices?.[0]?.name}
          </Text>
        </Flex>
        <Flex alignItems="center">
          <Box w="140px">
            <Text color="grey.400">{t("Script")}</Text>
          </Box>
          <Text>{script?.name}</Text>
        </Flex>
      </Stack>
      <Divider />
      <Stack spacing="4">
        <Heading as="h5" size="md">
          {t("Parameters")}
        </Heading>
        {inputs?.map((input) => (
          <FormControl
            key={input.name}
            label={input.label}
            placeholder={input.description}
            control={form.control}
            name={`userInputs.${input.name}`}
          />
        ))}
      </Stack>
      <Divider />
      <ScheduleForm />
    </Stack>
  );
}

type Form = {
  userInputs: {
    [k: string]: string;
  };
} & ScheduleFormType;

type RunScriptButtonProps = {
  devices: SimpleDevice[] | Device[];
  driver: string;
  script: Script;
};

export default function RunScriptButton(props: RunScriptButtonProps) {
  const { devices, driver, script } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);
  const form = useForm<Form>();

  const mutation = useMutation(api.task.create, {
    onSuccess() {},
    onError(err: NetshotError) {
      toast.error({
        title: t("Error"),
        // @ts-ignore
        description: err?.errorMsg,
      });
    },
  });

  const onSubmit = useCallback(
    async (data: Form) => {
      const { schedule, userInputs } = data;
      const tasks: Task[] = [];

      for (const device of devices) {
        const task = await mutation.mutateAsync({
          type: TaskType.RunDeviceScript,
          device: device?.id,
          driver,
          script: script?.script,
          userInputs,
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

  // Find solution to pass useMemo prop (like description) to avoid using update method
  const dialog = Dialog.useForm({
    title: t("Run script"),
    description: (
      <RunScriptForm devices={devices} script={script} driver={driver} />
    ),
    form,
    isLoading: mutation.isLoading,
    onSubmit,
    size: "xl",
    submitButton: {
      label: t("Run"),
    },
  });

  const open = useCallback(() => {
    dialog.updateProps({
      description: (
        <RunScriptForm devices={devices} script={script} driver={driver} />
      ),
    });

    dialog.open();
  }, [dialog, script, driver]);

  return (
    <>
      <IconButton
        aria-label={t("Run script")}
        variant="primary"
        icon={<Icon name="play" />}
        onClick={open}
      />
      {taskId && <TaskDialog id={taskId} {...disclosure} />}
    </>
  );
}
