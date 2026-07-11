import { EmptyResult } from "@/components"
import { Skeleton, Stack } from "@chakra-ui/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AnimatePresence } from "framer-motion"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import { useDeviceConfigs } from "../api"
import { DeviceConfigurationCompareWidget } from "../components/DeviceConfigurationCompareWidget"
import DeviceConfigurationPanel from "../components/DeviceConfigurationPanel"
import { useDeviceConfigurationCompareStore } from "../stores"

export default function DeviceConfigurationScreen() {
  const params = useParams<{ id: string }>()
  const { t } = useTranslation()
  const current = useDeviceConfigurationCompareStore((state) => state.current)
  const containerRef = useRef<HTMLDivElement>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set())

  const { data, isPending } = useDeviceConfigs(+params.id)

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const virtualizer = useVirtualizer({
    count: data?.length ?? 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 67,
    measureElement: (element) => element?.getBoundingClientRect().height,
    overscan: 5,
  })

  if (data?.length === 0) {
    return (
      <EmptyResult
        title={t("device.config.noneForDevice")}
        description={t("device.config.noConfiguration")}
      />
    )
  }

  if (isPending) {
    return (
      <Stack gap="3">
        <Skeleton h="60px"></Skeleton>
        <Skeleton h="60px"></Skeleton>
        <Skeleton h="60px"></Skeleton>
        <Skeleton h="60px"></Skeleton>
      </Stack>
    )
  }

  return (
    <Stack gap="3" flex="1" minH="0">
      <AnimatePresence>{current && <DeviceConfigurationCompareWidget />}</AnimatePresence>
      <Stack ref={containerRef} flex="1" minH="0" overflow="auto" gap="0">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const config = data[virtualItem.index]

            return (
              <div
                key={config?.id}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  paddingBottom: "12px",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <DeviceConfigurationPanel
                  config={config}
                  configs={data}
                  isNewest={virtualItem.index === 0}
                  isOldest={virtualItem.index === data.length - 1}
                  isExpanded={expandedIds.has(config?.id)}
                  onToggleExpand={toggleExpand}
                />
              </div>
            )
          })}
        </div>
      </Stack>
    </Stack>
  )
}
