import api from "@/api"
import { QUERIES } from "@/constants"
import { Heading, Skeleton, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import { ConfigurationComplianceDeviceList } from "../components"

export default function ReportConfigurationComplianceDetailScreen() {
  const { t } = useTranslation()
  const params = useParams<{
    id: string
  }>()

  const { data: group, isSuccess } = useQuery({
    queryKey: [QUERIES.DEVICE_GROUPS, +params?.id],
    queryFn: async () => {
      /**
       * @todo: Add devices count and non compliant count
       */
      return api.group.getById(+params.id)
    },
  })

  return (
    <Stack p="9" gap="6" flex="1" overflowY="auto">
      <Stack direction="row" gap="6" alignItems="center">
        <Stack gap="2">
          <Skeleton loading={!isSuccess}>
            <Heading fontWeight="medium">{group?.name}</Heading>
          </Skeleton>
          <Skeleton loading={!isSuccess}>
            <Text color="grey.500">
              {t(
                "hereIsAListOfNonCompliantDevicesYouCanCheckWhyADeviceIsNotCo"
              )}
            </Text>
          </Skeleton>
        </Stack>
      </Stack>
      {isSuccess && <ConfigurationComplianceDeviceList group={group} />}
    </Stack>
  )
}
