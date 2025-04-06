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
import { FieldValues, FormProvider, UseFormReturn, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { genericMemo } from "@/utils";

import { ModalConfigContext } from "./ModalConfigContext";
import { BaseDialogProps, PromiseOrVoid } from "./types";

export type FormDialogProps<F extends FieldValues = FieldValues> = {
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

function FormDialog<F extends FieldValues = FieldValues>(props: FormDialogProps<F>) {
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
    <ModalConfigContext.Provider
      value={{
        close: onCancel,
      }}
    >
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
          scrollBehavior="inside"
          blockScrollOnMount={false}
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
    </ModalConfigContext.Provider>
  );
}

export default genericMemo(FormDialog);
