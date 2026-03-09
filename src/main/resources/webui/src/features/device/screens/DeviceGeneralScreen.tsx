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
        <Heading fontSize="lg">{t("Information")}</Heading>
        <Stack gap="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Name")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.name ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Management IP")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.mgmtAddress ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Management domain")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.mgmtDomain?.name ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Status")}</Text>
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
              <Text color="grey.400">{t("Location")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.location ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Contact")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.contact ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
        </Stack>
      </Stack>
      <Stack gap="5">
        <Heading fontSize="lg">{t("Device details")}</Heading>
        <Stack gap="3">
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Network class")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.networkClass ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Device type")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.realDeviceType ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Family")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.family ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Software version")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.softwareVersion ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Serial number")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.serialNumber ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Creation date")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.createdDate ? formatDate(device?.createdDate) : "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Last change")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.changeDate ? formatDate(device?.changeDate) : "N/A"}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Last connection date")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>
                {device?.lastConnectionDate ? formatDate(device?.lastConnectionDate) : t("Never")}
              </Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Comments")}</Text>
            </Box>
            <Skeleton loading={!!isLoading}>
              <Text>{device?.comments ?? t("N/A")}</Text>
            </Skeleton>
          </Flex>
          <Flex alignItems="center">
            <Box flex="0 0 auto" w="200px">
              <Text color="grey.400">{t("Groups")}</Text>
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
          <Heading fontSize="lg">{t("Specific attributes")}</Heading>
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
