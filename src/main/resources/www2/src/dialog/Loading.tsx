import { genericMemo } from "@/utils";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { isValidElement, useMemo } from "react";
import { BaseDialogProps, PromiseOrVoid } from "./types";

export type LoadingDialogProps = {
  onComplete?(): PromiseOrVoid;
} & Omit<BaseDialogProps, "onCancel" | "isLoading">;

function LoadingDialog(props: LoadingDialogProps) {
  const { title, description, isOpen, onComplete } = props;

  const isTitleComponent = useMemo(() => isValidElement(title), [title]);
  const isDescriptionComponent = useMemo(
    () => isValidElement(description),
    [description]
  );

  return (
    <Modal
      isOpen={isOpen}
      isCentered
      onClose={onComplete ? onComplete : null}
      motionPreset="slideInBottom"
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
          <Stack direction="row" spacing="4" alignItems="center" pb="5">
            <Spinner color="primary" />

            {isDescriptionComponent ? (
              <>{description}</>
            ) : (
              <Text>{description}</Text>
            )}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default genericMemo(LoadingDialog);
