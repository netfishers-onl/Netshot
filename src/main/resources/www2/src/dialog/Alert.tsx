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
  Text,
} from "@chakra-ui/react";
import { isValidElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BaseDialogProps } from "./types";

export type AlertDialogProps = {
  closeButton?: {
    label?: string;
    props?: ButtonProps;
  };
} & BaseDialogProps;

function AlertDialog(props: AlertDialogProps) {
  const { t } = useTranslation();
  const {
    isOpen,
    title,
    description,
    isLoading,
    onCancel,
    closeButton,
    size,
    variant,
    hideFooter,
  } = props;
  const isTitleComponent = useMemo(() => isValidElement(title), [title]);
  const isDescriptionComponent = useMemo(
    () => isValidElement(description),
    [description]
  );
  const closeButtonConfig: AlertDialogProps["closeButton"] = useMemo(
    () => ({
      label: closeButton?.label || t("OK"),
      props: {
        variant: "primary",
        isLoading,
        onClick: (evt: React.MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation();
          if (onCancel) onCancel();
        },
        ...closeButton?.props,
      },
    }),
    [closeButton, isLoading]
  );

  return (
    <Modal
      isOpen={isOpen}
      isCentered
      onClose={onCancel}
      motionPreset="slideInBottom"
      size={size}
      variant={variant}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent>
        {isTitleComponent ? (
          <>{title}</>
        ) : (
          <ModalHeader as="h3" fontSize="2xl" fontWeight="semibold">
            {title}
            <ModalCloseButton />
          </ModalHeader>
        )}
        <ModalBody>
          {isDescriptionComponent ? (
            <>{description}</>
          ) : (
            <Text>{description}</Text>
          )}
        </ModalBody>
        {!hideFooter && (
          <ModalFooter>
            <Stack direction="row" spacing="3">
              <Button {...closeButtonConfig?.props}>
                {closeButtonConfig?.label}
              </Button>
            </Stack>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

export default genericMemo(AlertDialog);
