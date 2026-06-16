import { Policy } from "@/types"
import { Icon, Stack, Status, Text } from "@chakra-ui/react"
import { Tooltip } from "@/components/ui/tooltip"
import { LuFolder, LuFolderOpen } from "react-icons/lu"
import { motion, useAnimationControls } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import RuleItem from "./RuleItem"

export type PolicyItemProps = {
  policy: Policy
  forceExpand?: boolean
}

export default function PolicyItem(props: PolicyItemProps) {
  const { policy, forceExpand } = props
  const { policyId, ruleId } = useParams()
  const navigate = useNavigate()
  const controls = useAnimationControls()
  const hasRules = useMemo(() => policy.rules?.length > 0, [policy])
  const isAssigned = useMemo(() => policy.targetGroups?.length > 0, [policy])
  const isActive = useMemo(() => !!policyId && +policyId === policy.id, [policyId, policy])
  const isPolicySelected = useMemo(() => isActive && !ruleId, [isActive, ruleId])
  const isRuleSelected = useMemo(() => isActive && !!ruleId, [isActive, ruleId])
  const startExpanded = (isActive || !!forceExpand) && hasRules
  const [isCollapsed, setIsCollapsed] = useState<boolean>(!startExpanded)

  useEffect(() => {
    if (isRuleSelected && hasRules) {
      setIsCollapsed(false)
      controls.start("show")
    }
  }, [isRuleSelected, hasRules, controls])

  useEffect(() => {
    if (!hasRules) {
      setIsCollapsed(true)
      controls.start("hidden")
    }
  }, [hasRules, controls])

  const handleClick = useCallback(async () => {
    navigate(`./config/${policy.id}`)
    if (!hasRules) return
    setIsCollapsed((prev) => !prev)
    await controls.start(isCollapsed ? "show" : "hidden")
  }, [navigate, policy.id, hasRules, isCollapsed, controls])

  return (
    <Stack gap="0" mx="-3">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderRadius="lg"
        bg={isPolicySelected ? "green.50" : "white"}
        height="36px"
        transition="all .2s ease"
        _hover={{
          bg: isPolicySelected ? "green.50" : "grey.50",
        }}
        onClick={handleClick}
        userSelect="none"
        cursor="pointer"
        px="3"
      >
        <Stack direction="row" gap="3" alignItems="center" title={policy?.name} overflow="hidden">
          <Icon color="green.600" size="md" flexShrink="0">
            {isCollapsed ? <LuFolder /> : <LuFolderOpen />}
          </Icon>
          <Text lineClamp={1}>{policy?.name}</Text>
        </Stack>
        {isAssigned && (
          <Tooltip content={policy.targetGroups.map((g) => g.name).join(", ")}>
            <Status.Root size="sm" colorPalette="green">
              <Status.Indicator />
            </Status.Root>
          </Tooltip>
        )}
      </Stack>
      <motion.div
        initial={startExpanded ? "show" : "hidden"}
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