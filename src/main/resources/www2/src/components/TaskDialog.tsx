import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { useToast } from "@/hooks";
import { TaskStatus } from "@/types";
import { formatDate } from "@/utils";
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spinner,
  Stack,
  Tag,
  Text,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export type TaskDialogProps = {
  id: number;
} & UseDisclosureReturn;

export default function TaskDialog(props: TaskDialogProps) {
  const { isOpen, onClose, id } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const [showLog, setShowLog] = useState<boolean>(false);
  const { data: task, isLoading } = useQuery(
    [QUERIES.TASK, id],
    async () => api.task.getById(id),
    {
      onError(err: NetshotError) {
        toast.error(err);
      },
      enabled: Boolean(id),
      refetchIntervalInBackground: true,
      refetchInterval: (res) => {
        if (isOpen) {
          if (
            res?.status === TaskStatus.Cancelled ||
            res?.status === TaskStatus.Failure ||
            res?.status === TaskStatus.Success
          ) {
            return false;
          }

          return 5000;
        }

        return false;
      },
    }
  );

  const toggleLog = useCallback(() => {
    setShowLog((prev) => !prev);
  }, []);

  const creationDate = useMemo(() => {
    return task?.creationDate ? formatDate(task?.creationDate) : null;
  }, [task]);

  const executionDate = useMemo(() => {
    return task?.executionDate ? formatDate(task?.executionDate) : null;
  }, [task]);

  useEffect(() => {
    if (!isOpen) {
      setShowLog(false);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      isCentered
      motionPreset="slideInBottom"
      onClose={onClose}
      size="2xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader as="h3" fontSize="xl" lineHeight="120%" fontWeight="bold">
          {t("Task details")}
        </ModalHeader>
        <ModalBody>
          <Stack spacing="6">
            <Stack spacing="3">
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("ID")}</Text>
                </Box>
                <Skeleton isLoaded={!isLoading}>
                  <Text>{task?.id ?? "N/A"}</Text>
                </Skeleton>
              </Flex>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("Description")}</Text>
                </Box>
                <Skeleton isLoaded={!isLoading}>
                  <Text>{task?.taskDescription ?? "N/A"}</Text>
                </Skeleton>
              </Flex>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("Comments")}</Text>
                </Box>
                <Skeleton isLoaded={!isLoading}>
                  <Text>{task?.comments ?? "N/A"}</Text>
                </Skeleton>
              </Flex>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("Creation")}</Text>
                </Box>
                <Skeleton isLoaded={!isLoading}>
                  <Text>{creationDate ?? "N/A"}</Text>
                </Skeleton>
              </Flex>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("Execution")}</Text>
                </Box>
                <Skeleton isLoaded={!isLoading}>
                  <Text>{executionDate ?? "N/A"}</Text>
                </Skeleton>
              </Flex>
              <Flex alignItems="center">
                <Box w="140px">
                  <Text color="grey.400">{t("Status")}</Text>
                </Box>
                <Skeleton isLoaded={!isLoading}>
                  {task?.status === TaskStatus.Scheduled && (
                    <Tag colorScheme="yellow">{t("Scheduled")}</Tag>
                  )}
                  {task?.status === TaskStatus.Running && (
                    <Stack direction="row" alignItems="center" spacing="3">
                      <Spinner size="sm" />
                      <Text>{t("Running")}</Text>
                    </Stack>
                  )}
                  {task?.status === TaskStatus.Failure && (
                    <Tag colorScheme="red">{t("Failure")}</Tag>
                  )}
                  {task?.status === TaskStatus.Cancelled && (
                    <Tag colorScheme="grey">{t("Cancelled")}</Tag>
                  )}
                  {task?.status === TaskStatus.Success && (
                    <Tag colorScheme="green">{t("Success")}</Tag>
                  )}
                  {task?.status === TaskStatus.Waiting && (
                    <Tag colorScheme="grey">{t("Waiting")}</Tag>
                  )}
                  {task?.status === TaskStatus.New && (
                    <Tag colorScheme="grey">{t("New")}</Tag>
                  )}
                </Skeleton>
              </Flex>
            </Stack>

            {task?.script && (
              <>
                <Divider />
                <Stack spacing="4">
                  <Heading size="sm">{t("Script")}</Heading>
                  <Stack spacing="4">
                    <Box
                      p="6"
                      borderWidth="1px"
                      borderColor="grey.100"
                      borderRadius="xl"
                    >
                      <Text fontFamily="mono" whiteSpace="pre-wrap">
                        {task?.script}
                      </Text>
                    </Box>

                    {Object.keys(task?.userInputValues)?.map((key) => (
                      <Flex alignItems="center" key={key}>
                        <Box w="140px">
                          <Text color="grey.400">{key}</Text>
                        </Box>

                        <Text>{task?.userInputValues[key] ?? "N/A"}</Text>
                      </Flex>
                    ))}
                  </Stack>
                </Stack>
              </>
            )}

            {showLog && (
              <>
                <Divider />
                <Heading size="sm">{t("Log")}</Heading>
                <Box
                  p="6"
                  borderWidth="1px"
                  borderColor="grey.100"
                  borderRadius="xl"
                >
                  <Text fontFamily="mono" whiteSpace="pre-wrap">
                    {task?.log}
                  </Text>
                </Box>
              </>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack direction="row" spacing="3">
            <Button onClick={toggleLog} isDisabled={task?.log === ""}>
              {t("Show logs")}
            </Button>
            <Button variant="primary" onClick={onClose}>
              {t("OK")}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
