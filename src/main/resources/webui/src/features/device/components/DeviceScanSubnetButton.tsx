import api, { CreateOrUpdateTaskPayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DomainSelect } from "@/components";
import FormControl from "@/components/FormControl";
import Icon from "@/components/Icon";
import TaskDialog from "@/components/TaskDialog";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Option, TaskType } from "@/types";
import {
  Button,
  Heading,
  IconButton,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

type Form = {
  domainId: Option<number>;
  subnets: string[];
};

export type DeviceScanSubnetButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

function DeviceCreateForm() {
  const form = useFormContext();
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subnets",
  });

  useEffect(() => {
    append("");
  }, []);

  return (
    <Stack spacing="6">
      <DomainSelect isRequired control={form.control} name="domainId" />
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
                  placeholder={t("Enter an IP address (e.g. 10.100.2.8)")}
                  rules={{
                    pattern: {
                      value:
                        /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
                      message: t("This is not a valid IP address"),
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
          <Button leftIcon={<Icon name="plus" />} onClick={() => append("")}>
            {t("Add entry")}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default function DeviceScanSubnetButton(
  props: DeviceScanSubnetButtonProps
) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const [taskId, setTaskId] = useState<number>(null);

  const form = useForm<Form>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      domainId: null,
      subnets: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: CreateOrUpdateTaskPayload) =>
      api.task.create(payload),
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const onSubmit = useCallback(
    async (values: Form) => {
      const task = await mutation.mutateAsync({
        type: TaskType.ScanSubnets,
        subnets: values.subnets.join("\n"),
        domain: values.domainId.value,
      });

      dialog.close();
      setTaskId(task?.id);
      disclosure.onOpen();
    },
    [mutation, disclosure]
  );

  const dialog = Dialog.useForm({
    title: t("Scan subnets for devices"),
    description: <DeviceCreateForm />,
    form,
    isLoading: mutation.isPending,
    onSubmit,
    size: "xl",
    submitButton: {
      label: t("Add"),
    },
  });

  return (
    <>
      {renderItem(dialog.open)}
      {taskId && <TaskDialog id={taskId} {...disclosure} />}
    </>
  );
}
