import { genericMemo } from "@/utils";
import {
  Button,
  ButtonProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { FormProvider, UseFormReturn, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BaseDialogProps, PromiseOrVoid } from "./types";

export type FormDialogProps<F = any> = {
  onSubmit(data: F): PromiseOrVoid;
  form: UseFormReturn<F>;
  submitButton?: {
    label?: string;
    props?: ButtonProps;
  };
  cancelButton?: {
    label?: string;
    props?: ButtonProps;
  };
} & BaseDialogProps;

function FormDialog<F = any>(props: FormDialogProps<F>) {
  const {
    isOpen,
    title,
    description,
    isLoading,
    onCancel,
    onSubmit,
    form,
    submitButton,
    cancelButton,
    size,
    variant,
  } = props;

  const { t } = useTranslation();

  // Permet d'observer l'état du formulaire dans ce contexte
  const formState = useFormState({ control: form.control });

  // Combine les options fournies et par défaut
  const submitButtonConfig: FormDialogProps["submitButton"] = useMemo(
    () => ({
      label: submitButton?.label || "submit",
      props: {
        type: "submit",
        key: "submit",
        variant: "primary",
        isDisabled: !formState?.isValid,
        isLoading,
        autoFocus: true,
        ...submitButton?.props,
      },
    }),
    [formState.isValid, submitButton, isLoading]
  );

  const cancelButtonConfig: FormDialogProps["cancelButton"] = useMemo(
    () => ({
      label: cancelButton?.label || t("Cancel"),
      props: {
        variant: "default",
        disabled: isLoading,
        onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation();
          onCancel();
        },
        ...cancelButton?.props,
      },
    }),
    [cancelButton, isLoading]
  );

  return (
    <FormProvider {...form}>
      <Modal
        initialFocusRef={null}
        finalFocusRef={null}
        isOpen={isOpen}
        isCentered
        onClose={onCancel}
        motionPreset="slideInBottom"
        size={size}
        variant={variant}
      >
        <ModalOverlay />
        <ModalContent
          containerProps={{
            as: "form",
            onSubmit: form.handleSubmit(onSubmit),
          }}
        >
          <ModalHeader as="h3" fontSize="2xl" fontWeight="semibold">
            {title}
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody>
            {typeof description === "function" ? description() : description}
          </ModalBody>

          <ModalFooter>
            <Stack direction="row" spacing="3">
              <Button {...cancelButtonConfig.props}>
                {cancelButtonConfig?.label}
              </Button>
              <Button {...submitButtonConfig.props}>
                {submitButtonConfig?.label}
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormProvider>
  );
}

export default genericMemo(FormDialog);
