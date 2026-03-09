import api from "@/api"
import { MonacoEditor } from "@/components"
import Icon from "@/components/Icon"
import { RuleType } from "@/types"
import {
  Box,
  Button,
  Flex,
  Heading,
  Menu,
  Portal,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import DisableRuleButton from "../components/DisableRuleButton"
import EditRuleButton from "../components/EditRuleButton"
import EditRuleExemptedDeviceButton from "../components/EditRuleExemptedDeviceButton"
import EnableRuleButton from "../components/EnableRuleButton"
import RuleRemoveButton from "../components/RemoveRuleButton"
import { QUERIES } from "../constants"
import { RuleProvider } from "../contexts"

export default function ComplianceDetailScreen() {
  const { policyId, ruleId } = useParams()
  const { t } = useTranslation()

  const { data: rule, isPending } = useQuery({
    queryKey: [QUERIES.RULE_DETAIL, +policyId, +ruleId],
    queryFn: async () => api.rule.getById(+policyId, +ruleId),
  })

  return (
    <RuleProvider rule={rule} isLoading={isPending}>
      <Stack p="9" gap="9" flex="1">
        <Flex alignItems="center">
          <Skeleton loading={isPending}>
            <Stack direction="row" gap="3" alignItems="center">
              <Heading as="h1" fontSize="4xl">
                {rule?.name}
              </Heading>
              {rule?.deviceDriver && (
                <Tag.Root variant="outline">{rule?.deviceDriverDescription}</Tag.Root>
              )}
            </Stack>
          </Skeleton>

          <Spacer />
          <Stack direction="row" gap="3">
            <Skeleton loading={isPending}>
              {rule && (
                <EditRuleButton
                  key={rule?.id}
                  policyId={+policyId}
                  rule={rule}
                  renderItem={(open) => (
                    <Button variant="primary" onClick={open}>
                      {t("Edit")}
                    </Button>
                  )}
                />
              )}
            </Skeleton>

            <Menu.Root>
              <Skeleton loading={isPending}>
                <Menu.Trigger asChild>
                  <Button>
                    {t("Actions")}
                    <Icon name="moreHorizontal" />
                  </Button>
                </Menu.Trigger>
              </Skeleton>

              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    {rule && (
                      <>
                        <EditRuleExemptedDeviceButton
                          policyId={+policyId}
                          rule={rule}
                          renderItem={(open) => (
                            <Menu.Item onSelect={open} value="exempted-device">
                              <Icon name="server" />
                              {t("Exempted devices")}
                            </Menu.Item>
                          )}
                        />
                        {rule?.enabled ? (
                          <DisableRuleButton
                            policyId={+policyId}
                            rule={rule}
                            renderItem={(open) => (
                              <Menu.Item onSelect={open} value="disable">
                                <Icon name="power" />
                                {t("Disable")}
                              </Menu.Item>
                            )}
                          />
                        ) : (
                          <EnableRuleButton
                            policyId={+policyId}
                            rule={rule}
                            renderItem={(open) => (
                              <Menu.Item onSelect={open} value="enable">
                                <Icon name="power" />
                                {t("Enable")}
                              </Menu.Item>
                            )}
                          />
                        )}

                        <RuleRemoveButton
                          policyId={+policyId}
                          rule={rule}
                          renderItem={(open) => (
                            <Menu.Item onSelect={open} value="remove">
                              <Icon name="trash" />
                              {t("Remove")}
                            </Menu.Item>
                          )}
                        />
                      </>
                    )}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Stack>
        </Flex>
        {rule?.type === RuleType.Text && (
          <Stack gap="3">
            <Flex>
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("Device type")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text>{rule?.deviceDriverDescription ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex>
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("Field to check")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text>{rule?.field ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex>
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("Context")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text fontFamily="mono">{rule?.context ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex>
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("Must not contain")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text fontFamily="mono">{rule?.text ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
          </Stack>
        )}

        {rule?.type === RuleType.Javascript && (
          <MonacoEditor key={rule?.script} value={rule?.script} language="javascript" readOnly />
        )}

        {rule?.type === RuleType.Python && (
          <MonacoEditor key={rule?.script} value={rule?.script} language="python" readOnly />
        )}
      </Stack>
    </RuleProvider>
  )
}
