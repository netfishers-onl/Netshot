import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Menu,
  Portal,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { LuAlignLeft, LuChevronDown, LuPencil, LuPlus, LuTrash } from "react-icons/lu"
import { SiJavascript, SiPython } from "react-icons/si"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { RuleType } from "@/types"
import AddRuleButton from "../components/AddRuleButton"
import EditPolicyButton from "../components/EditPolicyButton"
import RemovePolicyButton from "../components/RemovePolicyButton"
import { usePolicies } from "../api"
import { DeviceGroupBadge } from "@/components"

function getRuleIcon(type: RuleType) {
  if (type === RuleType.Javascript) return <SiJavascript />
  if (type === RuleType.Python) return <SiPython />
  return <LuAlignLeft />
}

export default function ConfigurationCompliancePolicyScreen() {
  const { policyId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: policies, isPending } = usePolicies()

  const policy = useMemo(
    () => policies?.find((p) => p.id === +policyId),
    [policies, policyId]
  )

  return (
    <Stack p="9" gap="9" flex="1">
      <Flex alignItems="center">
        <Skeleton loading={isPending}>
          <Heading as="h1" fontSize="4xl">
            {policy?.name}
          </Heading>
        </Skeleton>

        <Spacer />
        <Stack direction="row" gap="3">
          <Skeleton loading={isPending}>
            {policy && (
              <EditPolicyButton
                policy={policy}
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
                  {policy && (
                    <>
                      <AddRuleButton
                        policy={policy}
                        renderItem={(open) => (
                          <Menu.Item onSelect={open} value="add-rule">
                            <LuPlus />
                            {t("policy.rule.add")}
                          </Menu.Item>
                        )}
                      />
                      <RemovePolicyButton
                        policy={policy}
                        renderItem={(open) => (
                          <Menu.Item
                            onSelect={open}
                            value="remove"
                            color="fg.error"
                            _hover={{ bg: "bg.error", color: "fg.error" }}
                          >
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

      <Stack gap="3">
        <Flex>
          <Box flex="0 0 auto" w="200px">
            <Text color="grey.400">{t("common.targetGroups")}</Text>
          </Box>
          <Skeleton loading={isPending}>
            <Stack direction="row" gap="2" flexWrap="wrap">
              {policy?.targetGroups?.length ? (
                policy.targetGroups.map((group) => (
                  <DeviceGroupBadge key={group.id} id={group.id} name={group.name} />
                ))
              ) : (
                <Text color="grey.400">—</Text>
              )}
            </Stack>
          </Skeleton>
        </Flex>
      </Stack>

      <Stack gap="4" maxW="2xl">
        <Heading as="h2" fontSize="2xl" fontWeight="semibold">
          {t("policy.rule.labelPlural")}
        </Heading>
        {!isPending && policy?.rules?.length === 0 && (
          <Text color="grey.400">{t("common.noRuleFound")}</Text>
        )}
        {policy?.rules?.map((rule) => (
          <Flex
            key={rule.id}
            alignItems="center"
            gap="3"
            p="3"
            borderRadius="md"
            borderWidth="1px"
            cursor="pointer"
            _hover={{ bg: "grey.50" }}
            onClick={() => navigate(`./${rule.id}`)}
          >
            <Icon color="green.600" size="md" opacity={rule.enabled ? 1 : 0.5}>
              {getRuleIcon(rule.type)}
            </Icon>
            <Text opacity={rule.enabled ? 1 : 0.5} flex="1" lineClamp={1}>
              {rule.name}
            </Text>
            {!rule.enabled && (
              <Tag.Root colorPalette="grey" variant="surface" size="sm">
                <Tag.Label>{t("common.disabled")}</Tag.Label>
              </Tag.Root>
            )}
          </Flex>
        ))}
        {policy && (
          <AddRuleButton
            policy={policy}
            renderItem={(open) => (
              <Button variant="outline" alignSelf="flex-start" onClick={open}>
                <LuPlus />
                {t("policy.rule.add")}
              </Button>
            )}
          />
        )}
      </Stack>
    </Stack>
  )
}
