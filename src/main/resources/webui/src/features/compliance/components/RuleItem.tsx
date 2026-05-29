import { Icon, IconButton, Menu, Portal, Stack, Text } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"

import { Protected } from "@/components"
import { Javascript, Python } from "@/components/icons"
import { Level, Policy, Rule, RuleType } from "@/types"

import { LuAlignLeft, LuSquarePen, LuEllipsis, LuPower, LuTrash } from "react-icons/lu"
import DisableRuleButton from "./DisableRuleButton"
import EditRuleButton from "./EditRuleButton"
import EnableRuleButton from "./EnableRuleButton"
import RemoveRuleButton from "./RemoveRuleButton"

export type RuleItemProps = {
  policy: Policy
  rule: Rule
}

export default function RuleItem(props: RuleItemProps) {
  const { policy, rule } = props
  const { t } = useTranslation()
  const { policyId, ruleId } = useParams()
  const navigate = useNavigate()

  const iconEl = useMemo(() => {
    if (rule.type === RuleType.Javascript) {
      return (
        <Javascript />
      );
    } else if (rule.type === RuleType.Python) {
      return (
        <Python />
      );
    } else {
      return (
        <LuAlignLeft />
      );
    }
  }, [rule])

  const isActive = useMemo(
    () => +policyId === policy.id && +ruleId === rule.id,
    [policyId, policy, ruleId, rule]
  )

  const isDisabled = !rule?.enabled

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      borderRadius="md"
      height="36px"
      bg={isActive ? "green.50" : "white"}
      transition="all .2s ease"
      _hover={{
        bg: isActive ? "green.50" : "grey.50",
      }}
      userSelect="none"
      cursor="pointer"
      pr="3"
      pl="3"
      onClick={() => navigate(`./config/${policy?.id}/${rule?.id}`)}
    >
      <Stack direction="row" gap="3" alignItems="center">
        <Icon color="green.600" size="md" opacity={isDisabled ? 0.5 : 1}>
          {iconEl}
        </Icon>
        <Text lineClamp={1} opacity={isDisabled ? 0.5 : 1}>{rule?.name}</Text>
      </Stack>
    </Stack>
  )
}
