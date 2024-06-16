import api, { CreateOrUpdateRule } from "@/api";
import { NetshotError } from "@/api/httpClient";
import { BoxWithIconButton } from "@/components";
import { QUERIES as GLOBAL_QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { Policy, RuleType } from "@/types";
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
import { useNavigate } from "react-router-dom";
import { QUERIES } from "../constants";
import { RuleForm } from "../types";
import { RuleEditForm } from "./RuleEditForm";
import RuleEditScript from "./RuleEditScript";

enum FormStep {
  Type,
  Details,
}

export type AddRuleButtonProps = {
  policy: Policy;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

export default function AddRuleButton(props: AddRuleButtonProps) {
  const { policy, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [type, setType] = useState(RuleType.Text);
  const [formStep, setFormStep] = useState(FormStep.Type);
  const disclosure = useDisclosure();
  const [size, setSize] = useState("4xl");
  const [variant, setVariant] =
    useState<ThemingProps<"Modal">["variant"]>(null);

  const form = useForm<RuleForm>({
    defaultValues: {
      name: "",
      script: "",
      text: "",
      regExp: false,
      context: "",
      driver: null,
      field: null,
      anyBlock: null,
      matchAll: false,
      invert: null,
      normalize: false,
    },
  });

  const createMutation = useMutation(api.rule.create, {
    onSuccess(rule) {
      close();
      disclosure.onOpen();

      queryClient.invalidateQueries([GLOBAL_QUERIES.POLICY_LIST]);
      queryClient.invalidateQueries([QUERIES.POLICY_RULE_LIST, policy.id]);

      form.reset();

      toast.success({
        title: t("Success"),
        description: t("Rule {{ruleName}} has been successfully created", {
          ruleName: rule?.name,
        }),
      });

      navigate(`/app/compliance/${policy.id}/${rule.id}`);
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
  });

  const title = useMemo(() => {
    if (formStep === FormStep.Type) {
      return t("Choose rule type");
    }

    return t("Add rule");
  }, [formStep, t]);

  const submit = useCallback(
    (values: RuleForm) => {
      let payload: CreateOrUpdateRule = {
        id: null,
        name: values.name,
        type,
        script: values.script,
        policy: policy.id,
        enabled: true,
        text: values.text,
        regExp: values.regExp,
        context: values.context,
        driver: values.driver?.value?.name,
        field: values.field?.value,
        anyBlock: values.anyBlock?.value,
        matchAll: values.matchAll,
        invert: values.invert?.value,
        normalize: values.normalize,
      };

      createMutation.mutate(payload);
    },
    [createMutation, type]
  );

  const next = useCallback(() => {
    setFormStep(FormStep.Details);
    setVariant(type === RuleType.Text ? "floating" : "full-floating");
    setSize("2xl");

    if (type === RuleType.Javascript) {
      form.setValue(
        "script",
        `
/*
 * Script template - to be customized.
 */
function check(device) {
    //var config = device.get('runningConfig');
    //var name = device.get('name');
    return CONFORMING;
    //return NONCONFORMING;
    //return NOTAPPLICABLE;
}
      `
      );
    } else if (type === RuleType.Python) {
      form.setValue(
        "script",
        `
# Script template - to be customized
def check(device):
  ## Grab some data:
  #  config = device.get('running_config')
  #  name = device.get('name')
  ## Some additional checks here...
  ## debug('device name = %s' % name)
  return result_option.CONFORMING
  # return {'result': result_option.NONCONFORMING, 'comment': 'Why it is not fine'}
  # return result_option.NOTAPPLICABLE
      `
      );
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
        type: RuleType.Text,
        label: t("Text"),
        description: t("Create a rule using String and RegExp"),
      },
      {
        icon: "javascript",
        type: RuleType.Javascript,
        label: t("Javascript"),
        description: t("Create a rule using a javascript language"),
      },
      {
        icon: "python",
        type: RuleType.Python,
        label: t("Python"),
        description: t("Create a rule using a python language"),
      },
    ],
    [t]
  );

  form.watch((values) => {
    if (type === RuleType.Text) return;

    if (values.script?.length === 0) {
      form.setError("script", {
        message: t("This field is required"),
      });
    }
  });

  const open = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation();
      onOpen();
    },
    [onOpen]
  );

  return (
    <FormProvider {...form}>
      {renderItem(open)}

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
          <ModalBody overflow="scroll" flex="1" display="flex">
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
                {type === RuleType.Text ? (
                  <RuleEditForm flex="1" type={type} />
                ) : (
                  <RuleEditScript type={type} />
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
                  isLoading={createMutation.isLoading}
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
