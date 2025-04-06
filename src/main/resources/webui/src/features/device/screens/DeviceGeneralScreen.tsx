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

import { DeviceAttribute, DeviceAttributeDefinition, DeviceAttributeLevel, DeviceAttributeType, DeviceBinaryAttribute, DeviceNumericAttribute, DeviceStatus, DeviceTextAttribute, DeviceTypeAttributeType } from "@/types";
import { formatDate } from "@/utils";

import { useDevice } from "../contexts/device";
import { useMemo } from "react";

type DeviceNumericAttributeValueType = {
  attribute: DeviceNumericAttribute;
};

function DeviceNumericAttributeValue(props: DeviceNumericAttributeValueType) {
  const { attribute } = props;
  const { t } = useTranslation();

  return (
    <Text>{attribute?.number ?? t("N/A")}</Text>
  )
}

type DeviceTextAttributeValueType = {
  attribute: DeviceTextAttribute;
};

function DeviceTextAttributeValue(props: DeviceTextAttributeValueType) {
  const { attribute } = props;
  const { t } = useTranslation();

  return (
    <Text>{attribute?.text ?? t("N/A")}</Text>
  )
}

type DeviceBinaryAttributeValueType = {
  attribute: DeviceBinaryAttribute;
};

function DeviceBinaryAttributeValue(props: DeviceBinaryAttributeValueType) {
  const { attribute } = props;
  const { t } = useTranslation();

  if (attribute?.assumption === true) {
    return (
      <Text>{t("True")}</Text>
    )
  }
  else if (attribute?.assumption === false) {
    return (
      <Text>{t("False")}</Text>
    )
  }
  return (
    <Text>{t("N/A")}</Text>
  )
}

type DeviceAttributeValueType = {
  attribute: DeviceAttribute;
  definition: DeviceAttributeDefinition;
};

function DeviceAttributeValue(props: DeviceAttributeValueType) {
  const { attribute, definition } = props;
  const { t } = useTranslation();

  switch (definition.type) {
  case DeviceAttributeType.Numeric:
    return (
      <DeviceNumericAttributeValue attribute={attribute as DeviceNumericAttribute} />
    );
  case DeviceAttributeType.Text:
    return (
      <DeviceTextAttributeValue attribute={attribute as DeviceTextAttribute} />
    );
  case DeviceAttributeType.Binary:
    return (
      <DeviceBinaryAttributeValue attribute={attribute as DeviceBinaryAttribute} />
    );
  default:
    return (
      <Text>{t("Unsupported attribute")}</Text>
    );
  }
}

export default function DeviceGeneralScreen() {
  const { t } = useTranslation();
  const { device, type, isLoading } = useDevice();
  const attributeDefinitions = useMemo<DeviceAttributeDefinition[]>(() => {
    return type?.attributes.filter(a => a.level === DeviceAttributeLevel.Device);
  }, [type]);

  return (
    <Stack spacing="12">
      <Stack spacing="5">
        <Heading fontSize="lg">{t("Information")}</Heading>
        <Stack spacing="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Name")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.name ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Management IP")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.mgmtAddress ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Management domain")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.mgmtDomain?.name ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
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
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Location")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.location ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Contact")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.contact ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
        </Stack>
      </Stack>
      <Stack spacing="5">
        <Heading fontSize="lg">{t("Device details")}</Heading>
        <Stack spacing="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Network class")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.networkClass ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Device type")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.realDeviceType ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Family")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.family ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Software version")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.softwareVersion ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Serial number")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.serialNumber ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Creation date")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.createdDate ? formatDate(device?.createdDate) : "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Last change")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.changeDate ? formatDate(device?.changeDate) : "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Comments")}</Text>
            </Box>
            <Skeleton isLoaded={!isLoading}>
              <Text>{device?.comments ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
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
      {type?.attributes?.length > 0 &&
        <Stack spacing="5">
          <Heading fontSize="lg">{t("Specific attributes")}</Heading>
          {attributeDefinitions.map((attrDef) => {
            const attr = device?.attributes?.find(a => a.name === attrDef.name);
            return (
              <Stack spacing="3" key={attrDef.name}>
                <Flex alignItems="center">
                  <Box flex="0 0 auto" w="200px">
                    <Text color="grey.400">{t(attrDef.title)}</Text>
                  </Box>
                  <Skeleton isLoaded={!isLoading}>
                    <DeviceAttributeValue
                      definition={attrDef}
                      attribute={attr}
                    />
                  </Skeleton>
                </Flex>
              </Stack>
            );
          })}
        </Stack>
      }
    </Stack>
  );
}
