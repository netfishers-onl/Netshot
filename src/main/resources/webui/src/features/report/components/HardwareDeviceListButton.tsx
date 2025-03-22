import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { DataTable, EmptyResult } from "@/components";
import { useToast } from "@/hooks";
import { HardwareSupportDevice } from "@/types";
import { formatDate } from "@/utils";
import {
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { MouseEvent, ReactElement, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { QUERIES } from "../constants";

export type HardwareDeviceListButtonProps = {
  type: "eos" | "eol";
  date: number;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
};

const columnHelper = createColumnHelper<HardwareSupportDevice>();

export default function HardwareDeviceListButton(
  props: HardwareDeviceListButtonProps
) {
  const { type, date, renderItem } = props;
  const { t } = useTranslation();
  const toast = useToast();
  const disclosure = useDisclosure();
  const formattedDate = useMemo(
    () => formatDate(new Date(date).toISOString()),
    [date]
  );

  const { data, isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_HARDWARE_STATUS, type, date],
    queryFn() {
      return api.report.getAllHardwareSupportDevices(type, date);
    },
    enabled: disclosure.isOpen,
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        cell: (info) => (
          <Text
            as={Link}
            to={`/app/devices/${info.row.original.id}/general`}
            textDecoration="underline"
          >
            {info.getValue()}
          </Text>
        ),
        header: t("Device"),
      }),
      columnHelper.accessor("mgmtAddress", {
        cell: (info) => info.getValue(),
        header: t("Management IP"),
      }),
      columnHelper.accessor("family", {
        cell: (info) => info.getValue(),
        header: t("Family"),
      }),
    ],
    [t]
  );

  const title = useMemo(
    () => (type === "eol" ? "End of life devices" : "End of sale devices"),
    [type]
  );

  return (
    <>
      {renderItem(disclosure.onOpen)}
      <Modal
        scrollBehavior="inside"
        size="6xl"
        isOpen={disclosure.isOpen}
        onClose={disclosure.onClose}
      >
        <ModalOverlay />
        <ModalContent height="90vh">
          <ModalHeader display="flex" alignItems="center" gap="4">
            <Heading as="h3" fontSize="2xl" fontWeight="semibold">
              {t(title)}
            </Heading>
            <Tag colorScheme="grey">{formattedDate}</Tag>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody
            overflowY="auto"
            display="flex"
            flexDirection="column"
            flex="1"
            pb="7"
          >
            {isPending ? (
              <Stack spacing="3">
                <Skeleton h="60px" />
                <Skeleton h="60px" />
                <Skeleton h="60px" />
                <Skeleton h="60px" />
              </Stack>
            ) : (
              <>
                {data?.length > 0 ? (
                  <DataTable data={data} columns={columns} />
                ) : (
                  <EmptyResult
                    title={t("No device")}
                    description={t(
                      "There is no device with end of life status at this date"
                    )}
                  />
                )}
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
