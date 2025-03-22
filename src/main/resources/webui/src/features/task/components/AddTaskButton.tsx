import api, { CreateOrUpdateTaskPayload } from "@/api";
import {
  Checkbox,
  DomainSelect,
  FormControl,
  Icon,
  Switch,
  TreeGroupSelector,
} from "@/components";
import { FormControlType } from "@/components/FormControl";
import ScheduleForm, { ScheduleFormType } from "@/components/ScheduleForm";
import TaskDialog from "@/components/TaskDialog";
import { useToast } from "@/hooks";
import { Group, Option, TaskType } from "@/types";
import {
  Button,
  Divider,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { QUERIES } from "../constants";
import TaskBoxButton from "./TaskBoxButton";

enum FormStep {
  Type,
  Details,
}

type Form = {
  checkCompliance: boolean;
  runDiagnostic: boolean;
  group: Group;
  limitToOutofdateDevice: boolean;
  limitToOutofdateDeviceHours?: number;
  domain?: Option<number>;
  subnets?: string[];
  configDaysToPurge?: number;
  hasConfigDaysToPurge?: boolean;
  configKeepDays?: number;
  hasConfigKeepDays?: boolean;
  configSizeToPurge?: number;
  hasConfigSizeToPurge?: boolean;

  daysToPurge?: number;
} & ScheduleFormType;

export type AddTaskButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddTaskButton(props: AddTaskButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [taskType, setTaskType] = useState<TaskType>(null);
  const [formStep, setFormStep] = useState(FormStep.Type);
  const disclosure = useDisclosure();
  const form = useForm<Form>({
    defaultValues: {
      subnets: [""],
      limitToOutofdateDeviceHours: 0,
      checkCompliance: false,
      runDiagnostic: false,
      group: null,
      domain: null,
      daysToPurge: 90,
      configDaysToPurge: 200,
      configSizeToPurge: 500,
      configKeepDays: 7,
      hasConfigDaysToPurge: false,
      hasConfigKeepDays: false,
      hasConfigSizeToPurge: false,
    },
  });
  const [taskId, setTaskId] = useState<number>(null);

  const hasConfigDaysToPurge = useWatch({
    control: form.control,
    name: "hasConfigDaysToPurge",
  });

  const hasConfigKeepDays = useWatch({
    control: form.control,
    name: "hasConfigKeepDays",
  });

  const hasConfigSizeToPurge = useWatch({
    control: form.control,
    name: "hasConfigSizeToPurge",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    // @ts-ignore
    name: "subnets",
  });

  const createMutation = useMutation({
    mutationFn: api.task.create,
    onSuccess(newTask) {
      close();
      setTaskId(newTask.id);
      disclosure.onOpen();

      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_ALL] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_CANCELLED] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_FAILED] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_RUNNING] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_SCHEDULED] });
      queryClient.invalidateQueries({ queryKey: [QUERIES.TASK_SUCCEEDED] });
    },
    onError() {
      toast.error({
        title: t("Error"),
        description: t("An error occurred during the task creation"),
      });
    },
  });

  const hasGroup = useMemo(
    () =>
      taskType === TaskType.TakeGroupSnapshot ||
      taskType === TaskType.RunGroupDiagnostic ||
      taskType === TaskType.CheckGroupCompliance ||
      taskType === TaskType.CheckGroupSoftware,
    [taskType]
  );

  const submit = useCallback(
    (values: Form) => {
      const { schedule } = values;

      const payload: CreateOrUpdateTaskPayload = {
        type: taskType,
        ...schedule,
      };

      if (taskType === TaskType.TakeGroupSnapshot) {
        payload.dontRunDiagnostics = !values.runDiagnostic;

        if (values.limitToOutofdateDevice) {
          payload.limitToOutofdateDeviceHours =
            values.limitToOutofdateDeviceHours;
        }
      }

      if (
        taskType === TaskType.TakeGroupSnapshot ||
        taskType === TaskType.RunGroupDiagnostic
      ) {
        payload.dontCheckCompliance = !values.checkCompliance;
      }

      if (hasGroup) {
        payload.group = values.group.id;
      }

      if (taskType === TaskType.ScanSubnets) {
        payload.domain = values.domain.value;
        payload.subnets = values.subnets.join("\n");
      }

      if (taskType === TaskType.PurgeDatabase) {
        payload.daysToPurge = values.daysToPurge;

        if (hasConfigDaysToPurge) {
          payload.configDaysToPurge = values.configDaysToPurge;
        }

        payload.configSizeToPurge = hasConfigSizeToPurge
          ? values.configSizeToPurge
          : 0;
        payload.configKeepDays = hasConfigKeepDays ? values.configKeepDays : 0;
      }

      createMutation.mutate(payload);
    },
    [
      createMutation,
      hasGroup,
      hasConfigDaysToPurge,
      hasConfigKeepDays,
      hasConfigSizeToPurge,
    ]
  );

  const next = useCallback(() => {
    setFormStep(FormStep.Details);
  }, []);

  const previous = useCallback(() => {
    setTaskType(null);
    setFormStep(FormStep.Type);
  }, [form]);

  const close = useCallback(() => {
    onClose();

    setTimeout(() => {
      setTaskType(null);
      setFormStep(FormStep.Type);
    });
  }, [onClose, form]);

  const taskTypeOptions = useMemo(
    () => [
      {
        icon: "camera",
        type: TaskType.TakeGroupSnapshot,
        label: t("Snapshot"),
        description: t("Take a snapshot of group of devices"),
      },
      {
        icon: "play",
        type: TaskType.RunGroupDiagnostic,
        label: t("Diagnostic"),
        description: t("Run diagnostics on a group of devices"),
      },
      {
        icon: "check",
        type: TaskType.CheckGroupCompliance,
        label: t("Configuration compliance"),
        description: t(
          "Check the configuration compliance of a group of devices"
        ),
      },
      {
        icon: "server",
        type: TaskType.CheckGroupSoftware,
        label: t("Software & hardware compliance"),
        description: t(
          "Check the software compliance and hardware support status of a group of devices"
        ),
      },
      {
        icon: "search",
        type: TaskType.ScanSubnets,
        label: t("Discover devices"),
        description: t("Scan subnets to discover devices"),
      },
      {
        icon: "database",
        type: TaskType.PurgeDatabase,
        label: t("Purge database"),
        description: t("Purge old entries from the database"),
      },
    ],
    [t]
  );

  const taskInfoBox = useMemo(() => {
    const selectedType = taskTypeOptions.find((opt) => opt.type === taskType);

    return (
      <Stack spacing="0" borderRadius="2xl" bg="green.50" p="6">
        <Text color="green.800" fontWeight="semibold">
          {selectedType?.label}
        </Text>
        <Text color="green.800">{selectedType?.description}</Text>
      </Stack>
    );
  }, [t, taskType, taskTypeOptions]);

  const limitToOutofdateDevice = useWatch({
    control: form.control,
    name: "limitToOutofdateDevice",
  });

  const group = useWatch({
    control: form.control,
    name: "group",
  });

  useEffect(() => {
    form.reset();
  }, [taskType, form]);

  useEffect(() => {
    form.setValue("hasConfigKeepDays", hasConfigDaysToPurge);
    form.setValue("hasConfigSizeToPurge", hasConfigDaysToPurge);
  }, [hasConfigDaysToPurge]);

  return (
    <FormProvider {...form}>
      {renderItem(onOpen)}

      <Modal
        blockScrollOnMount={false}
        isCentered
        isOpen={isOpen}
        onClose={close}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent
          containerProps={{
            as: "form",
            onSubmit: form.handleSubmit(submit),
          }}
        >
          <ModalHeader display="flex" justifyContent="space-between">
            <Heading as="h3" fontSize="2xl" fontWeight="semibold">
              {t("Add task")}
            </Heading>

            <Text fontSize="md" color="grey.400">
              {t(formStep === FormStep.Type ? "Step 1/2" : "Step 2/2")}
            </Text>
          </ModalHeader>
          <ModalBody overflow="scroll" flex="1" display="flex">
            {formStep === FormStep.Type ? (
              <Stack spacing="3">
                {taskTypeOptions.map((option) => (
                  <TaskBoxButton
                    icon={option.icon}
                    label={option.label}
                    description={option.description}
                    isActive={option.type === taskType}
                    onClick={() => setTaskType(option.type)}
                    key={option.label}
                  />
                ))}
              </Stack>
            ) : (
              <Stack spacing="6" flex="1">
                {taskInfoBox}

                {hasGroup && (
                  <TreeGroupSelector
                    label={t("Group to process")}
                    value={group ? [group] : []}
                    onChange={(groups) => form.setValue("group", groups?.[0])}
                  />
                )}

                {taskType === TaskType.TakeGroupSnapshot && (
                  <>
                    <Checkbox
                      control={form.control}
                      name="limitToOutofdateDevice"
                    >
                      {t("Limit to devices unchanged for")}
                    </Checkbox>

                    <FormControl
                      control={form.control}
                      name="limitToOutofdateDeviceHours"
                      type={FormControlType.Number}
                      isDisabled={!limitToOutofdateDevice}
                      isRequired={limitToOutofdateDevice}
                    />
                    <Checkbox control={form.control} name="runDiagnostic">
                      {t("Run the device diagnostics after snapshot")}
                    </Checkbox>
                  </>
                )}

                {[
                  TaskType.TakeGroupSnapshot,
                  TaskType.RunGroupDiagnostic,
                ].includes(taskType) && (
                  <Checkbox control={form.control} name="checkCompliance">
                    {t("Check device compliance after the snapshot")}
                  </Checkbox>
                )}

                {taskType === TaskType.ScanSubnets && (
                  <>
                    <DomainSelect
                      isRequired
                      control={form.control}
                      name="domain"
                    />
                    <Stack spacing="6">
                      <Heading as="h5" size="sm">
                        {t("Subnets or IP addresses")}
                      </Heading>
                      {fields.length > 0 && (
                        <Stack spacing="3">
                          {fields.map((field, index) => (
                            <Stack direction="row" spacing="4" key={field.id}>
                              <FormControl
                                isRequired
                                control={form.control}
                                name={`subnets.${index}`}
                                placeholder={t(
                                  "Enter an IP address (e.g. 10.100.2.8)"
                                )}
                                rules={{
                                  pattern: {
                                    value:
                                      /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
                                    message: t(
                                      "This is not a valid IP address"
                                    ),
                                  },
                                }}
                              />
                              {fields.length > 1 && (
                                <IconButton
                                  onClick={() => remove(index)}
                                  icon={<Icon name="trash" />}
                                  variant="ghost"
                                  colorScheme="green"
                                  aria-label={t("Remove this subnet")}
                                />
                              )}
                            </Stack>
                          ))}
                        </Stack>
                      )}
                      <Stack direction="row">
                        <Button
                          leftIcon={<Icon name="plus" />}
                          onClick={() => append("")}
                        >
                          {t("Add entry")}
                        </Button>
                      </Stack>
                    </Stack>
                  </>
                )}

                {taskType === TaskType.PurgeDatabase && (
                  <Stack spacing="5">
                    <Stack spacing="3">
                      <Stack spacing="0">
                        <Text fontWeight="medium">{t("Purge tasks")}</Text>
                        <Text color="grey.400">
                          {t("Purge tasks finished more than")}
                        </Text>
                      </Stack>
                      <FormControl
                        control={form.control}
                        name="daysToPurge"
                        type={FormControlType.Number}
                      />
                    </Stack>
                    <Divider />
                    <Stack spacing="3">
                      <Stack direction="row" spacing="6">
                        <Stack spacing="0" flex="1">
                          <Text fontWeight="medium">
                            {t("Purge configuration")}
                          </Text>
                          <Text color="grey.400">
                            {t("Delete old configurations prior to")}
                          </Text>
                        </Stack>
                        <Switch
                          w="initial"
                          control={form.control}
                          name="hasConfigDaysToPurge"
                        />
                      </Stack>
                      <FormControl
                        isDisabled={!hasConfigDaysToPurge}
                        control={form.control}
                        name="configDaysToPurge"
                        type={FormControlType.Number}
                        suffix={
                          <Text color="grey.400" pr="5">
                            {t("Days")}
                          </Text>
                        }
                      />
                    </Stack>
                    <Divider />
                    <Stack spacing="3">
                      <Stack direction="row" spacing="6">
                        <Stack spacing="0" flex="1">
                          <Text fontWeight="medium">
                            {t("Configuration size")}
                          </Text>
                          <Text color="grey.400">
                            {t("Only configurations bigger than")}
                          </Text>
                        </Stack>
                        <Switch
                          w="initial"
                          control={form.control}
                          name="hasConfigSizeToPurge"
                        />
                      </Stack>
                      <FormControl
                        isDisabled={!hasConfigSizeToPurge}
                        control={form.control}
                        name="configSizeToPurge"
                        type={FormControlType.Number}
                        suffix={
                          <Text color="grey.400" pr="5">
                            {t("KB")}
                          </Text>
                        }
                      />
                    </Stack>
                    <Divider />
                    <Stack spacing="3">
                      <Stack direction="row" spacing="6">
                        <Stack spacing="0" flex="1">
                          <Text fontWeight="medium">
                            {t("Keep configuration")}
                          </Text>
                          <Text color="grey.400">
                            {t("Keep for each device one config every")}
                          </Text>
                        </Stack>
                        <Switch
                          w="initial"
                          control={form.control}
                          name="hasConfigKeepDays"
                        />
                      </Stack>
                      <FormControl
                        isDisabled={!hasConfigKeepDays}
                        control={form.control}
                        name="configKeepDays"
                        type={FormControlType.Number}
                        suffix={
                          <Text color="grey.400" pr="5">
                            {t("Days")}
                          </Text>
                        }
                      />
                    </Stack>
                  </Stack>
                )}
                <ScheduleForm />
              </Stack>
            )}
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            {formStep === FormStep.Details && (
              <Button onClick={previous}>{t("Previous")}</Button>
            )}
            <Stack direction="row" spacing="3" flex="1" justifyContent="end">
              <Button onClick={close}>{t("Cancel")}</Button>
              {formStep === FormStep.Type && (
                <Button
                  variant="primary"
                  isDisabled={taskType === null}
                  onClick={next}
                >
                  {t("Next")}
                </Button>
              )}

              {formStep === FormStep.Details && (
                <Button
                  type="submit"
                  isDisabled={!form.formState.isValid}
                  isLoading={createMutation.isPending}
                  variant="primary"
                >
                  {t("Create")}
                </Button>
              )}
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {taskId && <TaskDialog id={taskId} {...disclosure} />}
    </FormProvider>
  );
}
