import Icon from "@/components/Icon"
import { Config } from "@/types"
import { useI18nUtil } from "@/i18n"
import { getConfigDeviceAttributeDefinitions } from "@/utils"
import { Button, IconButton, Separator, Skeleton, Spacer, Stack, Tag, Text } from "@chakra-ui/react"
import { motion, useAnimationControls } from "framer-motion"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useDevice } from "../contexts/device"
import { useDeviceConfigurationCompareStore } from "../stores"
import DeviceConfigurationAttribute from "./DeviceConfigurationAttribute"

export type DeviceConfigurationPanelProps = {
  config: Config
}

export default function DeviceConfigurationPanel(props: DeviceConfigurationPanelProps) {
  const { config } = props
  const { t } = useTranslation()
  const { formatDate } = useI18nUtil()
  const controls = useAnimationControls()
  const { type, isLoading } = useDevice()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true)
  const attributeDefinitions = type ? getConfigDeviceAttributeDefinitions(type.attributes) : []
  const setCurrent = useDeviceConfigurationCompareStore((state) => state.setCurrent)

  const changeDate = useMemo(() => {
    return formatDate(config?.changeDate)
  }, [config, formatDate])

  const toggleCollapse = useCallback(async () => {
    setIsCollapsed((prev) => !prev)
    await controls.start(isCollapsed ? "show" : "hidden")
  }, [controls, isCollapsed])

  return (
    <Stack borderWidth="1px" borderColor="grey.100" borderRadius="2xl" key={config.id} gap="0">
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
          variant="ghost"
          colorPalette="green"
          aria-label={t("open")}
          css={{
            transform: isCollapsed ? "rotate(-90deg)" : "",
          }}
        >
          <Icon name="chevronDown" />
        </IconButton>
        <Text fontSize="md" fontWeight="semibold">
          {changeDate}
        </Text>
        {config?.author && <Tag.Root colorPalette="grey">{config?.author}</Tag.Root>}

        <Spacer />
        <Button
          variant="ghost"
          colorPalette="green"
          className="compare-button"
          opacity="0"
          onClick={(evt) => {
            evt.stopPropagation()
            setCurrent(config)
          }}
        >
          {t("compare")}
        </Button>
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
