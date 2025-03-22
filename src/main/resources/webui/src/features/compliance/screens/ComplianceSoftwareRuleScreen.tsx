import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult, Icon, Protected, Search } from "@/components";
import { useAuth } from "@/contexts";
import { usePagination, useToast } from "@/hooks";
import { Level, SoftwareRule } from "@/types";
import { getSoftwareLevelColor, search } from "@/utils";
import {
  Button,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
  Tooltip,
  UseDisclosureProps,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Row, createColumnHelper } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AddSoftwareRuleButton from "../components/AddSoftwareRuleButton";
import EditSoftwareRuleButton from "../components/EditSoftwareRuleButton";
import RemoveSoftwareRuleButton from "../components/RemoveSoftwareRuleButton";
import { QUERIES } from "../constants";

type ConfirmReorderDialogProps = {
  reorderState: {
    id: number;
    nextId: number;
  };
} & UseDisclosureProps;

function ConfirmReorderDialog(props: ConfirmReorderDialogProps) {
  const { isOpen, onClose, reorderState } = props;
  const { t } = useTranslation();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () => {
      return api.softwareRule.reorder(reorderState.id, reorderState.nextId);
    },
    onError(err: NetshotError) {
      toast.error(err);
    },
    onSuccess() {
      onClose();
    },
  });

  const confirm = useCallback(() => {
    mutation.mutate();
  }, [mutation]);

  return (
    <Modal
      isOpen={isOpen}
      isCentered
      onClose={onClose}
      motionPreset="slideInBottom"
      size="lg"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader as="h3" fontSize="2xl" fontWeight="semibold">
          {t("Change priority")}
        </ModalHeader>
        <ModalBody>
          <Text>{t("Are you sure to change rules priorities?")}</Text>
        </ModalBody>
        <ModalFooter>
          <Stack direction="row" spacing="3">
            <Button onClick={onClose}>{t("Cancel")}</Button>
            <Button variant="primary" onClick={confirm}>
              {t("Apply changes")}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const columnHelper = createColumnHelper<SoftwareRule>();

export default function ComplianceSoftwareRuleScreen() {
  const { t } = useTranslation();
  const pagination = usePagination();
  const toast = useToast();
  const { user } = useAuth();
  const disclosure = useDisclosure();
  const [reorderState, setReorderState] = useState({
    id: null,
    nextId: null,
  });
  const [data, setData] = useState<SoftwareRule[]>([]);

  const { data: rules, isPending, isSuccess, refetch } = useQuery({
    queryKey: [QUERIES.SOFTWARE_RULE_LIST, pagination.query],
    queryFn: api.softwareRule.getAll,
    select: useCallback((res: SoftwareRule[]): SoftwareRule[] => {
      return search(res, "deviceType", "family").with(pagination.query);
    }, [pagination.query]),
  });

  useEffect(() => {
    if (isSuccess) {
      setData(rules);
    }
  }, [isSuccess, rules]);

  const isDraggable = useMemo(() => {
    return (user?.level || 0) >= Level.ReadWrite;
  }, [user]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("targetGroup", {
        cell: (info) => info.getValue()?.name || t("[Any]"),
        header: t("Group"),
        size: 10000,
      }),
      columnHelper.accessor("deviceType", {
        cell: (info) => info.getValue() || t("[Any]"),
        header: t("Device"),
        size: 10000,
      }),
      columnHelper.accessor("family", {
        cell: (info) => info.getValue(),
        header: t("Device family"),
        size: 10000,
      }),
      columnHelper.accessor("partNumber", {
        cell: (info) => info.getValue(),
        header: t("Part number"),
        size: 10000,
      }),
      columnHelper.accessor("version", {
        cell: (info) => info.getValue(),
        header: t("Version"),
        size: 10000,
      }),
      columnHelper.accessor("level", {
        cell: (info) => {
          const level = info.getValue();

          return <Tag colorScheme={getSoftwareLevelColor(level)}>{level}</Tag>;
        },
        header: t("Level"),
        size: 10000,
      }),
      columnHelper.accessor("id", {
        cell: (info) => {
          const rule = info.row.original;

          return (
            <Protected minLevel={Level.ReadWrite}>
              <Stack direction="row" spacing="2">
                <EditSoftwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip label={t("Edit")}>
                      <IconButton
                        variant="ghost"
                        colorScheme="green"
                        aria-label={t("Edit the rule")}
                        icon={<Icon name="edit" />}
                        onClick={open}
                      />
                    </Tooltip>
                  )}
                />

                <RemoveSoftwareRuleButton
                  rule={rule}
                  renderItem={(open) => (
                    <Tooltip label={t("Remove")}>
                      <IconButton
                        variant="ghost"
                        colorScheme="green"
                        aria-label={t("Remove the rule")}
                        icon={<Icon name="trash" />}
                        onClick={open}
                      />
                    </Tooltip>
                  )}
                />
              </Stack>
            </Protected>
          );
        },
        header: "",
        enableSorting: false,
        meta: {
          align: "right",
        },
        minSize: 80,
        size: 200,
      }),
    ],
    [t]
  );

  const onDrag = useCallback(
    (row: Row<SoftwareRule>, reorderedData: SoftwareRule[]) => {
      setData(reorderedData);
    },
    []
  );

  const onDrop = useCallback(
    (row: Row<SoftwareRule>, reorderedData: SoftwareRule[]) => {
      const currentIndex = reorderedData.findIndex(
        (item) => item.id === +row.id
      );
      const next = reorderedData[currentIndex + 1];

      setData(reorderedData);

      setReorderState({
        id: row.id,
        nextId: next?.id,
      });

      disclosure.onOpen();
    },
    []
  );

  const handleClose = useCallback(() => {
    disclosure.onClose();
    refetch();
  }, [disclosure]);

  return (
    <>
      <Stack spacing="6" p="9" flex="1" overflow="auto">
        <Heading as="h1" fontSize="4xl">
          {t("Software version compliance")}
        </Heading>
        <Stack direction="row" spacing="3">
          <Search
            placeholder={t("Search...")}
            onQuery={pagination.onQuery}
            onClear={pagination.onQueryClear}
            w="30%"
          />
          <Spacer />
          <Protected minLevel={Level.ReadWrite}>
            <Skeleton isLoaded={!isPending}>
              <AddSoftwareRuleButton
                renderItem={(open) => (
                  <Button
                    onClick={open}
                    variant="primary"
                    leftIcon={<Icon name="plus" />}
                  >
                    {t("Add rule")}
                  </Button>
                )}
              />
            </Skeleton>
          </Protected>
        </Stack>
        {isPending ? (
          <Stack spacing="3">
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
            <Skeleton h="60px"></Skeleton>
          </Stack>
        ) : (
          <>
            {data?.length > 0 ? (
              <DataTable
                columns={columns}
                data={data}
                loading={isPending}
                draggable={isDraggable}
                primaryKey="id"
                onDragRow={onDrag}
                onDropRow={onDrop}
              />
            ) : (
              <EmptyResult
                title={t("There is no software rule")}
                description={t(
                  "You can add rule to check device software compliance"
                )}
              >
                <AddSoftwareRuleButton
                  renderItem={(open) => (
                    <Button
                      onClick={open}
                      variant="primary"
                      leftIcon={<Icon name="plus" />}
                    >
                      {t("Add rule")}
                    </Button>
                  )}
                />
              </EmptyResult>
            )}
          </>
        )}
      </Stack>
    </>
  );
}
