import DeviceConfigurationSelect from "@/components/DeviceConfigurationSelect"
import { useAlertDialog } from "@/dialog"
import { Button, HStack, Text } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useShallow } from "zustand/react/shallow"
import { useDeviceConfigs } from "../api"
import { useDevice } from "../contexts/device"
import { useDeviceConfigurationCompareStore } from "../stores"
import DeviceConfigurationCompareView from "./DeviceConfigurationCompareView"

type FormData = {
  current: string
  compare: string
}

export function DeviceConfigurationCompareWidget() {
  const { t } = useTranslation()
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
  const { data: configs } = useDeviceConfigs(device.id)

  const form = useForm<FormData>({
    defaultValues: {
      current: current?.id?.toString(),
      compare: null,
    },
  })

  function cancel() {
    setCurrent(null)
    setCompare(null)
    form.reset({ current: null, compare: null })
  }

  function open() {
    dialog.open({
      title: t("Compare changes"),
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
    const subscription = form.watch((values) => {
      const currentConfig = configs?.find((c) => c.id.toString() === values.current)
      const compareConfig = configs?.find((c) => c.id.toString() === values.compare)
      setCurrent(currentConfig ?? null)
      setCompare(compareConfig ?? null)
    })
    return () => subscription.unsubscribe()
  }, [form, configs, setCurrent, setCompare])

  useEffect(() => {
    if (!configs?.length || !current) return

    const currentIndex = configs.findIndex((c) => c.id === current.id)
    const nextConfig = configs[currentIndex + 1]

    if (nextConfig) {
      form.setValue("compare", nextConfig.id.toString())
    }
  }, [configs, current])

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
        <HStack gap="5" flex="1">
          <DeviceConfigurationSelect
            control={form.control}
            name="current"
            deviceId={device.id}
            w="240px"
            variant="subtle"
          />
          <Text color="white" fontWeight="medium" flex="0 0 auto">
            {t("compare to")}
          </Text>
          <DeviceConfigurationSelect
            control={form.control}
            name="compare"
            deviceId={device.id}
            w="240px"
            variant="subtle"
          />
        </HStack>
        <HStack gap="3">
          <Button variant="subtle" onClick={cancel}>
            {t("Cancel")}
          </Button>
          <Button variant="primary" onClick={open} disabled={!current || !compare}>
            {t("Compare")}
          </Button>
        </HStack>
      </motion.div>
    </HStack>
  )
}
