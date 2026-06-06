import api from "@/api"
import { MonacoEditor } from "@/components"
import { LuMessageSquareDot, LuPower, LuPencil, LuTrash, LuChevronDown } from "react-icons/lu"
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
import { useDeviceTypeOptions } from "@/hooks"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import DisableRuleButton from "../components/DisableRuleButton"
import EditRuleButton from "../components/EditRuleButton"
import EditRuleExemptedDeviceButton from "../components/EditRuleExemptedDeviceButton"
import EnableRuleButton from "../components/EnableRuleButton"
import RuleRemoveButton from "../components/RemoveRuleButton"
import { QUERIES } from "../constants"
import { RuleProvider } from "../contexts"

export default function ConfigurationComplianceRuleScreen() {
  const { policyId, ruleId } = useParams()
  const { t } = useTranslation()
  const { getOptionByDriver } = useDeviceTypeOptions()

  const { data: rule, isPending } = useQuery({
    queryKey: [QUERIES.RULE_DETAIL, +policyId, +ruleId],
    queryFn: async () => api.rule.getById(+policyId, +ruleId),
  })

  const contextLabel = rule?.anyBlock
    ? t("policy.rule.atLeastOneSuchBlock")
    : t("policy.rule.allSuchBlocks")

  const fieldDescription = useMemo(() => {
    if (!rule?.field) return t("common.unknownLabel")
    if (rule.deviceDriver) {
      const attr = getOptionByDriver(rule.deviceDriver)?.value.attributes.find(
        (a) => a.name === rule.field
      )
      if (attr) return attr.title
    }
    const genericLabels: Record<string, string> = {
      contact: t("common.contact"),
      location: t("common.location"),
      name: t("common.name"),
    }
    return genericLabels[rule.field] ?? rule.field
  }, [rule, getOptionByDriver, t])

  const textLabel = useMemo(() => {
    if (!rule) return t("policy.rule.mustContain")
    const { invert, regExp, matchAll, context } = rule
    const prefix = context ? "" : "field"
    const key = (k: string) => t(`policy.rule.${prefix}${prefix ? k.charAt(0).toUpperCase() + k.slice(1) : k}`)
    if (regExp && matchAll) return invert ? key("mustNotFullyMatch") : key("mustFullyMatch")
    if (regExp) return invert ? key("mustNotMatch") : key("mustMatch")
    if (matchAll) return invert ? key("mustNotBe") : key("mustBe")
    return invert ? key("mustNotContain") : key("mustContain")
  }, [rule, t])

  return (
    <RuleProvider rule={rule} isLoading={isPending}>
      <Stack p="9" gap="9" flex="1">
        <Flex alignItems="center">
          <Skeleton loading={isPending}>
            <Stack direction="row" gap="3" alignItems="center">
              <Heading as="h1" fontSize="4xl">
                {rule?.name}
              </Heading>
              {rule && !rule?.enabled && (
                <Tag.Root colorPalette="grey" variant="surface">{t("common.disabled")}</Tag.Root>
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
                      <LuPencil />
                      {t("common.edit")}
                    </Button>
                  )}
                />
              )}
            </Skeleton>

            <Menu.Root>
              <Skeleton loading={isPending}>
                <Menu.Trigger asChild>
                  <Button>
                    {t("common.actions")}
                    <LuChevronDown />
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
                              <LuMessageSquareDot />
                              {t("policy.rule.exemptedDevices")}
                            </Menu.Item>
                          )}
                        />
                        {rule?.enabled ? (
                          <DisableRuleButton
                            policyId={+policyId}
                            rule={rule}
                            renderItem={(open) => (
                              <Menu.Item onSelect={open} value="disable">
                                <LuPower />
                                {t("common.disable")}
                              </Menu.Item>
                            )}
                          />
                        ) : (
                          <EnableRuleButton
                            policyId={+policyId}
                            rule={rule}
                            renderItem={(open) => (
                              <Menu.Item onSelect={open} value="enable">
                                <LuPower />
                                {t("common.enable")}
                              </Menu.Item>
                            )}
                          />
                        )}

                        <RuleRemoveButton
                          policyId={+policyId}
                          rule={rule}
                          renderItem={(open) => (
                            <Menu.Item onSelect={open} value="remove" color="fg.error" _hover={{ bg: "bg.error", color: "fg.error" }}>
                              <LuTrash />
                              {t("common.remove")}
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
                <Text color="grey.400">{t("device.type")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text>{rule?.deviceDriverDescription ?? "nA"}</Text>
              </Skeleton>
            </Flex>
            <Flex>
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("policy.rule.fieldToCheck")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text>{fieldDescription}</Text>
              </Skeleton>
            </Flex>
            {(rule?.context || isPending) && (
              <Flex>
                <Box flex="0 0 auto" w="200px">
                  <Text color="grey.400">{contextLabel}</Text>
                </Box>
                <Skeleton loading={isPending}>
                  <Text fontFamily="mono">{rule?.context}</Text>
                </Skeleton>
              </Flex>
            )}
            <Flex>
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{textLabel}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text fontFamily="mono">{rule?.text ?? "nA"}</Text>
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
