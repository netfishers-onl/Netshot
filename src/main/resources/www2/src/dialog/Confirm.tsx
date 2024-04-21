import { genericMemo } from "@/utils";
import {
  Button,
  ButtonProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { isValidElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BaseDialogProps, PromiseOrVoid } from "./types";

export type ConfirmDialogProps = {
  onConfirm(): PromiseOrVoid;
  confirmButton?: {
    label?: string;
    props?: ButtonProps;
  };
  cancelButton?: {
    label?: string;
    props?: ButtonProps;
  };
} & BaseDialogProps;

function ConfirmDialog(props: ConfirmDialogProps) {
  const { t } = useTranslation();
  const {
    isOpen,
    title,
    description,
    isLoading,
    onCancel,
    onConfirm,
    confirmButton,
    cancelButton,
    size = "lg",
  } = props;
  const isTitleComponent = useMemo(() => isValidElement(title), [title]);
  const isDescriptionComponent = useMemo(
    () => isValidElement(description),
    [description]
  );
  const confirmButtonConfig: ConfirmDialogProps["confirmButton"] = useMemo(
    () => ({
      label: confirmButton?.label || t("Confirm"),
      props: {
        variant: "primary",
        isLoading,
        onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation();
          if (onConfirm) onConfirm();
        },
        ...confirmButton?.props,
      },
    }),
    [confirmButton, isLoading, onConfirm]
  );

  const cancelButtonConfig: ConfirmDialogProps["cancelButton"] = useMemo(
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
    [cancelButton, isLoading, onCancel]
  );

  return (
    <Modal
      isOpen={isOpen}
      isCentered
      onClose={onCancel}
      motionPreset="slideInBottom"
      size={size}
    >
      <ModalOverlay />
      <ModalContent>
        {isTitleComponent ? (
          <>{title}</>
        ) : (
          <ModalHeader as="h3" fontSize="2xl" fontWeight="semibold">
            {title}
          </ModalHeader>
        )}
        <ModalBody>
          {isDescriptionComponent ? (
            <>{description}</>
          ) : (
            <Text>{description}</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Stack direction="row" spacing="3">
            <Button {...cancelButtonConfig?.props}>
              {cancelButtonConfig?.label}
            </Button>
            <Button {...confirmButtonConfig?.props}>
              {confirmButtonConfig?.label}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default genericMemo(ConfirmDialog);
