import { Box, Flex, Heading, Skeleton, Stack, Tag, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { DeviceAttributeDefinition, DeviceAttributeLevel, DeviceStatus } from "@/types"
import { useI18nUtil } from "@/i18n"

import { useMemo } from "react"
import { DeviceAttributeValue } from "../components"
import { useDevice } from "../contexts/device"

export default function DeviceGeneralScreen() {
  const { t } = useTranslation()
  const { formatDate } = useI18nUtil()
  const { device, type, isLoading } = useDevice()
  const attributeDefinitions = useMemo<DeviceAttributeDefinition[]>(() => {
    return type?.attributes.filter((a) => a.level === DeviceAttributeLevel.Device)
  }, [type])

  return (
    <Stack gap="12">
      <Stack gap="5">
        <Heading fontSize="lg">{t("common.information")}</Heading>
        <Stack gap="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("common.name")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.name ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("device.managementIp")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.mgmtAddress ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("device.managementDomain")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.mgmtDomain?.name ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("common.status")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              {device?.status === DeviceStatus.Production && (
                <Tag.Root colorPalette="green">Production</Tag.Root>
              )}
              {device?.status === DeviceStatus.Disabled && (
                <Tag.Root colorPalette="red">Disabled</Tag.Root>
              )}
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("common.location")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.location ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("common.contact")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.contact ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
        </Stack>
      </Stack>
      <Stack gap="5">
        <Heading fontSize="lg">{t("device.details")}</Heading>
        <Stack gap="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("device.networkClass")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.networkClass ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("device.type")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.realDeviceType ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("common.family")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.family ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("compliance.software.version")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.softwareVersion ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("device.module.serialNumber")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.serialNumber ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("time.creationDate")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.createdDate ? formatDate(device?.createdDate) : t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("device.lastChange")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.changeDate ? formatDate(device?.changeDate) : t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("device.lastConnectionDate")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>
                {device?.lastConnectionDate ? formatDate(device?.lastConnectionDate) : t("common.never")}
              </Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("common.comments")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.comments ?? t("common.nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("group.list")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Stack direction="row" gap="2">
                {device?.ownerGroups?.map((group) => (
                  <Tag.Root key={group?.id} colorPalette="grey">
                    {group?.name}
                  </Tag.Root>
                ))}
              </Stack>
            </Skeleton>
          </Flex>
        </Stack>
      </Stack>
      {type?.attributes?.length > 0 && attributeDefinitions?.length > 0 && (
        <Stack gap="5">
          <Heading fontSize="lg">{t("diagnostic.specificAttributes")}</Heading>
          {attributeDefinitions.map((attrDef) => {
            const attr = device?.attributes?.find((a) => a?.name === attrDef?.name)
            return (
              <Stack gap="3" key={attrDef?.name}>
                <Flex alignItems="center">
                  <Box flex="0 0 auto" w="200px">
                    <Text color="grey.400">{t(attrDef?.title)}</Text>
                  </Box>
                  <Skeleton loading={!!isLoading}>
                    <DeviceAttributeValue definition={attrDef} attribute={attr} />
                  </Skeleton>
                </Flex>
              </Stack>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
