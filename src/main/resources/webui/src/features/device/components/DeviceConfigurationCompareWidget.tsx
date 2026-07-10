import { useAlertDialog } from "@/dialog"
import { useLocalization } from "@/i18n"
import { Button, CloseButton, HStack, Input } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"
import { useShallow } from "zustand/react/shallow"
import { useDevice } from "../contexts/device"
import { useDeviceConfigurationCompareStore } from "../stores"
import DeviceConfigurationCompareView from "./DeviceConfigurationCompareView"

export function DeviceConfigurationCompareWidget() {
  const { t } = useTranslation()
  const { formatDateTime } = useLocalization()
  const { current, compare, setCurrent, setCompare } = useDeviceConfigurationCompareStore(
    useShallow((state) => ({
      setCurrent: state.setCurrent,
      setCompare: state.setCompare,
      current: state.current,
      compare: state.compare,
    }))
  )
  const dialog = useAlertDialog()
  const { device, type } = useDevice()

  function cancel() {
    setCurrent(null)
    setCompare(null)
  }

  function open() {
    dialog.open({
      title: t("common.compareChanges"),
      description: (
        <DeviceConfigurationCompareView
          current={current}
          compare={compare}
          device={device}
          type={type}
        />
      ),
      hideFooter: true,
      variant: "full-floating",
    })
  }

  useEffect(() => {
    return () => {
      cancel()
    }
  }, [device])

  return (
    <HStack
      p="6"
      bg="green.1100"
      borderRadius="3xl"
      justifyContent="space-between"
      className="dark"
      position="absolute"
      bottom="9"
      left="300px"
      right="0"
      width="fit-content"
      mx="auto"
      gap="12"
      zIndex="1"
      asChild
    >
      <motion.div
        initial={{ opacity: 0, translateY: 25 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: 25 }}
      >
        <HStack color="white" fontWeight="medium" flex="1" gap="3">
          <Trans
            t={t}
            i18nKey="device.config.compareXToY"
            components={{
              first: (
                <Input
                  readOnly
                  variant="subtle"
                  w="200px"
                  value={current ? formatDateTime(current.changeDate) : ""}
                />
              ),
              second: (
                <Input
                  readOnly
                  variant="subtle"
                  w="200px"
                  value={compare ? formatDateTime(compare.changeDate) : ""}
                  placeholder={t("device.config.select")}
                />
              ),
            }}
          />
        </HStack>
        <HStack gap="3">
          <Button variant="primary" onClick={open} disabled={!current || !compare}>
            {t("common.compare")}
          </Button>
          <CloseButton
            color="white"
            variant="ghost"
            _hover={{ bg: "green.1000" }}
            onClick={cancel}
            aria-label={t("common.cancel")}
          />
        </HStack>
      </motion.div>
    </HStack>
  )
}
