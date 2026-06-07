import { Policy } from "@/types"
import { Icon, Stack, Text } from "@chakra-ui/react"
import { LuFolder, LuFolderOpen } from "react-icons/lu"
import { motion, useAnimationControls } from "framer-motion"
import { useCallback, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import RuleItem from "./RuleItem"

export type PolicyItemProps = {
  policy: Policy
}

export default function PolicyItem(props: PolicyItemProps) {
  const { policy } = props
  const { policyId, ruleId } = useParams()
  const navigate = useNavigate()
  const controls = useAnimationControls()
  const hasRules = useMemo(() => policy.rules?.length > 0, [policy])
  const isActive = useMemo(() => !!policyId && +policyId === policy.id, [policyId, policy])
  const isPolicySelected = useMemo(() => isActive && !ruleId, [isActive, ruleId])
  const [isCollapsed, setIsCollapsed] = useState<boolean>(!isActive || !hasRules)

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
        <Stack direction="row" gap="3" alignItems="center" title={policy?.name}>
          <Icon color="green.600" size="md">
            {isCollapsed ? <LuFolder /> : <LuFolderOpen />}
          </Icon>
          <Text lineClamp={1}>{policy?.name}</Text>
        </Stack>
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