import { Protected } from "@/components"
import { Level, Policy } from "@/types"
import { Icon, IconButton, Menu, Portal, Stack, Text } from "@chakra-ui/react"
import { LuEllipsis, LuFolder, LuFolderOpen, LuPlus, LuSquarePen, LuTrash } from "react-icons/lu"
import { motion, useAnimationControls } from "framer-motion"
import { MouseEvent, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import AddRuleButton from "./AddRuleButton"
import EditPolicyButton from "./EditPolicyButton"
import RemovePolicyButton from "./RemovePolicyButton"
import RuleItem from "./RuleItem"

export type PolicyItemProps = {
  policy: Policy
}

export default function PolicyItem(props: PolicyItemProps) {
  const { policy } = props
  const { t } = useTranslation()
  const { policyId } = useParams()
  const controls = useAnimationControls()
  const hasRules = useMemo(() => policy.rules?.length > 0, [policy])
  const isActive = useMemo(() => !!policyId && +policyId === policy.id, [policyId, policy])
  const [isCollapsed, setIsCollapsed] = useState<boolean>(!isActive || !hasRules)

  const toggleCollapse = useCallback(
    async (evt?: MouseEvent<HTMLDivElement>) => {
      if (!hasRules) {
        return
      }

      evt?.stopPropagation()
      setIsCollapsed((prev) => !prev)
      await controls.start(isCollapsed ? "show" : "hidden")
    },
    [controls, isCollapsed, hasRules]
  )

  return (
    <Stack gap="0" mx="-3">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderRadius="lg"
        bg="white"
        height="36px"
        transition="all .2s ease"
        _hover={{
          bg: "grey.50",
        }}
        onClick={toggleCollapse}
        userSelect="none"
        cursor="pointer"
        px="3"
      >
        <Stack direction="row" gap="3" alignItems="center" title={policy?.name}>
          <Icon color="green.600" size="md">
            {isCollapsed ? <LuFolder /> : <LuFolderOpen />}
          </Icon>
          <Text lineClamp={1}>{policy?.name}</Text>
        </Stack>
        <Protected minLevel={Level.Operator}>
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                <LuEllipsis />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <AddRuleButton
                    policy={policy}
                    renderItem={(open) => (
                      <Menu.Item onSelect={open} value="add-rule">
                        <LuPlus />
                        {t("policy.rule.add")}
                      </Menu.Item>
                    )}
                  />
                  <EditPolicyButton
                    policy={policy}
                    renderItem={(open) => (
                      <Menu.Item onSelect={open} value="edit-rule">
                        <LuSquarePen />
                        {t("common.edit")}
                      </Menu.Item>
                    )}
                  />
                  <RemovePolicyButton
                    policy={policy}
                    renderItem={(open) => (
                      <Menu.Item onSelect={open} value="remove-rule" color="fg.error" _hover={{ bg: "bg.error", color: "fg.error" }}>
                        <LuTrash />
                        {t("common.remove")}
                      </Menu.Item>
                    )}
                  />
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Protected>
      </Stack>
      <motion.div
        initial={isActive && hasRules ? "show" : "hidden"}
        animate={controls}
        variants={{
          hidden: { opacity: 0, height: 0, pointerEvents: "none" },
          show: {
            opacity: 1,
            height: "auto",
            pointerEvents: "all",
          },
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <Stack direction="column" gap="0" pl="4">
          {policy.rules?.map((rule) => (
            <RuleItem key={rule?.id} policy={policy} rule={rule} />
          ))}
        </Stack>
      </motion.div>
    </Stack>
  )
}
