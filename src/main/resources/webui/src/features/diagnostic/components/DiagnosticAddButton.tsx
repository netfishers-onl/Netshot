import api, { CreateOrUpdateDiagnosticPayload } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { BoxWithIconButton } from "@/components";
import { useToast } from "@/hooks";
import {
  DeviceType,
  DiagnosticResultType,
  DiagnosticType,
  Group,
  Option,
} from "@/types";
import {
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  ThemingProps,
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
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { QUERIES } from "../constants";
import { DiagnosticEditForm } from "./DiagnosticEditForm";
import DiagnosticEditScript from "./DiagnosticEditScript";

const TEMPLATES = {
  [DiagnosticType.Javascript]: `
    function diagnose(cli, device, diagnostic) {
      cli.macro("enable");
      const output = cli.command("show something");
      // Process output somewhat
      diagnostic.set(output);
    }
  `,
  [DiagnosticType.Python]: `
    def diagnose(cli, device, diagnostic):
      cli.macro("enable")
      output = cli.command("show something")
      # Process output somewhat
      diagnostic.set(output)
  `,
};

enum FormStep {
  Type,
  Details,
}

type Form = {
  name: string;
  resultType: Option<DiagnosticResultType>;
  targetGroup: Group;
  deviceDriver: Option<DeviceType>;
  cliMode: Option<string>;
  command: string;
  modifierPattern: string;
  modifierReplacement: string;
  script: string;
};

export type AddDiagnosticButtonProps = {
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddDiagnosticButton(props: AddDiagnosticButtonProps) {
  const { renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [type, setType] = useState(DiagnosticType.Simple);
  const [formStep, setFormStep] = useState(FormStep.Type);
  const disclosure = useDisclosure();
  const [size, setSize] = useState("4xl");
  const [variant, setVariant] =
    useState<ThemingProps<"Modal">["variant"]>(null);
  const defaultValues = useMemo(() => {
    const values = {
      name: "",
      resultType: null,
      targetGroup: null,
      deviceDriver: null,
      cliMode: null,
      command: "",
      modifierPattern: "",
      modifierReplacement: "",
      script: "",
    } as Form;

    return values;
  }, []);

  const form = useForm<Form>({
    defaultValues,
  });
  const createMutation = useMutation({
    mutationFn: api.diagnostic.create,
    async onSuccess(diagnostic) {
      close();
      disclosure.onOpen();

      await queryClient.invalidateQueries({ queryKey: [QUERIES.DIAGNOSTIC_LIST] });

      form.reset();

      navigate(`/app/diagnostics/${diagnostic.id}`);

      toast.success({
        title: t("Success"),
        description: t(
          "Diagnostic {{diagnosticName}} has been successfully created",
          {
            diagnosticName: diagnostic?.name,
          }
        ),
      });
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const title = useMemo(() => {
    if (formStep === FormStep.Type) {
      return t("Choose diagnostic type");
    }

    return t("Add diagnostic");
  }, [formStep, t]);

  const submit = useCallback(
    (values: Form) => {
      let payload: CreateOrUpdateDiagnosticPayload = {
        id: null,
        enabled: true,
        type,
        name: values.name,
        resultType: values.resultType.value,
        targetGroup: values.targetGroup?.id?.toString(),
        deviceDriver: values.deviceDriver?.value?.name,
        cliMode: values.cliMode?.value,
        command: values.command,
        modifierPattern: values.modifierPattern,
        modifierReplacement: values.modifierReplacement,
        script: values.script,
      };

      createMutation.mutate(payload);
    },
    [createMutation, type]
  );

  const next = useCallback(() => {
    setFormStep(FormStep.Details);
    setVariant(type === DiagnosticType.Simple ? "floating" : "full-floating");
    setSize("2xl");

    if ([DiagnosticType.Javascript, DiagnosticType.Python].includes(type)) {
      form.setValue("script", TEMPLATES[type]);
    }
  }, [type]);

  const previous = useCallback(() => {
    setType(null);
    setFormStep(FormStep.Type);
    setVariant(null);
    setSize("4xl");
  }, [form]);

  const close = useCallback(() => {
    onClose();

    setTimeout(() => {
      setType(null);
      setFormStep(FormStep.Type);
      setVariant(null);
      setSize("4xl");
    }, 500);
  }, [onClose, form]);

  useEffect(() => {
    form.reset();
  }, [form]);

  const typeOptions = useMemo(
    () => [
      {
        icon: "alignLeft",
        type: DiagnosticType.Simple,
        label: t("Simple"),
        description: t("Create a diagnostic using String and RegEx"),
      },
      {
        icon: "javascript",
        type: DiagnosticType.Javascript,
        label: t("Javascript"),
        description: t("Create a diagnostic using a javascript language"),
      },
      {
        icon: "python",
        type: DiagnosticType.Python,
        label: t("Python"),
        description: t("Create a diagnostic using a python language"),
      },
    ],
    [t]
  );

  form.watch((values) => {
    if (type === DiagnosticType.Simple) return;

    if (values.script?.length === 0) {
      form.setError("script", {
        message: t("This field is required"),
      });
    }
  });

  return (
    <FormProvider {...form}>
      {renderItem(onOpen)}

      <Modal
        blockScrollOnMount={false}
        isCentered
        isOpen={isOpen}
        onClose={close}
        size={size}
        variant={variant}
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
              {title}
            </Heading>

            <Text fontSize="md" color="grey.400">
              {t(formStep === FormStep.Type ? "Step 1/2" : "Step 2/2")}
            </Text>
          </ModalHeader>
          <ModalBody flex="1" display="flex">
            {formStep === FormStep.Type ? (
              <Stack direction="row" spacing="5">
                {typeOptions.map((option) => (
                  <BoxWithIconButton
                    icon={option.icon}
                    title={option.label}
                    description={option.description}
                    isActive={option.type === type}
                    onClick={() => setType(option.type)}
                    key={option.label}
                  />
                ))}
              </Stack>
            ) : (
              <>
                {type === DiagnosticType.Simple ? (
                  <DiagnosticEditForm flex="1" type={type} />
                ) : (
                  <DiagnosticEditScript type={type} />
                )}
              </>
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
                  isDisabled={type === null}
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
    </FormProvider>
  );
}
