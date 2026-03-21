import { Box, Flex, Heading, Skeleton, Stack, Tag, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { DeviceAttributeDefinition, DeviceAttributeLevel, DeviceStatus } from "@/types"
import { formatDate } from "@/utils"

import { useMemo } from "react"
import { DeviceAttributeValue } from "../components"
import { useDevice } from "../contexts/device"

export default function DeviceGeneralScreen() {
  const { t } = useTranslation()
  const { device, type, isLoading } = useDevice()
  const attributeDefinitions = useMemo<DeviceAttributeDefinition[]>(() => {
    return type?.attributes.filter((a) => a.level === DeviceAttributeLevel.Device)
  }, [type])

  return (
    <Stack gap="12">
      <Stack gap="5">
        <Heading fontSize="lg">{t("information")}</Heading>
        <Stack gap="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("name")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.name ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("managementIp")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.mgmtAddress ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("managementDomain")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.mgmtDomain?.name ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("status")}</Text>
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
              <Text color="grey.400">{t("location")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.location ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("contact")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.contact ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
        </Stack>
      </Stack>
      <Stack gap="5">
        <Heading fontSize="lg">{t("deviceDetails")}</Heading>
        <Stack gap="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("networkClass")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.networkClass ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("deviceType")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.realDeviceType ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("family")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.family ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("softwareVersion")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.softwareVersion ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("serialNumber")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.serialNumber ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("creationDate")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.createdDate ? formatDate(device?.createdDate) : "nA"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("lastChange")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.changeDate ? formatDate(device?.changeDate) : "nA"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("lastConnectionDate")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>
                {device?.lastConnectionDate ? formatDate(device?.lastConnectionDate) : t("never")}
              </Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("comments")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.comments ?? t("nA")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("groups")}</Text>
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
          <Heading fontSize="lg">{t("specificAttributes")}</Heading>
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
