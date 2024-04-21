import { DeviceStatus } from "@/types";
import {
  Box,
  Flex,
  Heading,
  Skeleton,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useDevice } from "../contexts/DeviceProvider";

export default function DeviceGeneralScreen() {
  const { t } = useTranslation();
  const { device, isLoading } = useDevice();

  return (
    <Stack spacing="12">
      <Stack spacing="5">
        <Heading fontSize="lg">{t("Information")}</Heading>
        <Stack spacing="3">
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Name")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.name ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Management IP")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.mgmtAddress ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Management domain")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.mgmtDomain?.name ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Status")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              {device?.status === DeviceStatus.Production && (
                <Tag colorScheme="green">Production</Tag>
              )}
              {device?.status === DeviceStatus.Disabled && (
                <Tag colorScheme="red">Disabled</Tag>
              )}
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Location")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.location ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Contact")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.contact ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
        </Stack>
      </Stack>
      <Stack spacing="5">
        <Heading fontSize="lg">{t("Device detail")}</Heading>
        <Stack spacing="3">
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Network class")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.networkClass ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Device type")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.realDeviceType ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Family")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.family ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Software version")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.softwareVersion ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Serial number")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.serialNumber ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Creation date")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.createdDate ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Last change")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.changeDate ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Comments")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.comments ?? "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box w="200px">
              <Text color="grey.400">{t("Groups")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Stack direction="row" spacing="2">
                {device?.ownerGroups?.map((group) => (
                  <Tag key={group?.id} colorScheme="grey">
                    {group?.name}
                  </Tag>
                ))}
              </Stack>
            </Skeleton>
          </Flex>
        </Stack>
      </Stack>
    </Stack>
  );
}
