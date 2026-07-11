import { LuArrowLeftToLine, LuArrowRightToLine, LuChevronDown } from "react-icons/lu"
import { Config } from "@/types"
import { useLocalization } from "@/i18n"
import { getConfigDeviceAttributeDefinitions } from "@/utils"
import { Tooltip } from "@/components/ui/tooltip"
import { HStack, IconButton, Separator, Skeleton, Spacer, Stack, Tag, Text } from "@chakra-ui/react"
import { motion, useAnimationControls } from "framer-motion"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/react/shallow"
import { useDeviceConfigs } from "../api"
import { useDevice } from "../contexts/device"
import { useDeviceConfigurationCompareStore } from "../stores"
import DeviceConfigurationAttribute from "./DeviceConfigurationAttribute"

export type DeviceConfigurationPanelProps = {
  config: Config
}

export default function DeviceConfigurationPanel(props: DeviceConfigurationPanelProps) {
  const { config } = props
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const controls = useAnimationControls()
  const { device, type, isLoading } = useDevice()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true)
  const attributeDefinitions = type ? getConfigDeviceAttributeDefinitions(type.attributes) : []
  const { current, compare, setCurrent, setCompare } = useDeviceConfigurationCompareStore(
    useShallow((state) => ({
      current: state.current,
      compare: state.compare,
      setCurrent: state.setCurrent,
      setCompare: state.setCompare,
    }))
  )
  const { data: configs } = useDeviceConfigs(device?.id)
  const isCurrentSelected = current?.id === config.id
  const isCompareSelected = compare?.id === config.id

  // configs is sorted newest-first: index 0 is the most recent config (can't
  // sit on the older/left side), the last index is the oldest (can't sit on
  // the newer/right side).
  const configIndex = configs?.findIndex((c) => c.id === config.id) ?? -1
  const isNewest = configIndex === 0
  const isOldest = configIndex !== -1 && configIndex === configs.length - 1

  const changeDate = useMemo(() => {
    return formatDateTime(config?.changeDate)
  }, [config, formatDateTime])

  const toggleCollapse = useCallback(async () => {
    setIsCollapsed((prev) => !prev)
    await controls.start(isCollapsed ? "show" : "hidden")
  }, [controls, isCollapsed])

  return (
    <Stack borderWidth="1px" borderColor="grey.100" borderRadius="2xl" bg="white" gap="0">
      <Stack
        direction="row"
        gap="3"
        alignItems="center"
        p="3"
        onClick={toggleCollapse}
        cursor="pointer"
        _hover={{
          "& .compare-button": {
            opacity: 1,
          },
        }}
      >
        <IconButton
          size="sm"
          variant="ghost"
          colorPalette="green"
          aria-label={t("common.open")}
          css={{
            transform: isCollapsed ? "rotate(-90deg)" : "",
          }}
        >
          <LuChevronDown />
        </IconButton>
        <Text fontSize="md" fontWeight="semibold">
          {changeDate}
        </Text>
        {config?.author && <Tag.Root colorPalette="grey">{config?.author}</Tag.Root>}

        <Spacer />
        <HStack
          gap="0"
          className="compare-button"
          opacity={isCurrentSelected || isCompareSelected ? 1 : 0}
        >
          <Tooltip content={t("device.config.selectAsFirst")}>
            <IconButton
              size="sm"
              colorPalette="green"
              borderEndRadius="0"
              aria-label={t("device.config.selectAsFirst")}
              variant={isCurrentSelected ? "solid" : "ghost"}
              disabled={isNewest}
              onClick={(evt) => {
                evt.stopPropagation()
                setCurrent(config)
              }}
            >
              <LuArrowLeftToLine />
            </IconButton>
          </Tooltip>
          <Tooltip content={t("device.config.selectAsSecond")}>
            <IconButton
              size="sm"
              colorPalette="green"
              borderStartRadius="0"
              aria-label={t("device.config.selectAsSecond")}
              variant={isCompareSelected ? "solid" : "ghost"}
              disabled={isOldest}
              onClick={(evt) => {
                evt.stopPropagation()
                setCompare(config, configs)
              }}
            >
              <LuArrowRightToLine />
            </IconButton>
          </Tooltip>
        </HStack>
      </Stack>
      <motion.div
        initial="hidden"
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
        <Separator />
        <Stack direction="column" gap="3" p="6">
          {isLoading ? (
            <>
              <Skeleton w="80px" h="40px" />
              <Skeleton w="80px" h="40px" />
              <Skeleton w="80px" h="40px" />
            </>
          ) : (
            <>
              {attributeDefinitions?.map((attrDef) => (
                <DeviceConfigurationAttribute
                  key={attrDef?.name}
                  config={config}
                  definition={attrDef}
                />
              ))}
            </>
          )}
        </Stack>
      </motion.div>
    </Stack>
  )
}
