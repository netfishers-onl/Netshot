import { Splitter, Stack } from "@chakra-ui/react"
import { PropsWithChildren, ReactNode, useRef } from "react"
import { useTranslation } from "react-i18next"

import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH, useSidebarWidthStore } from "./useSidebarWidthStore"

export type SidebarSplitterProps = PropsWithChildren<{
  sidebar: ReactNode
}>

export default function SidebarSplitter(props: SidebarSplitterProps) {
  const { sidebar, children } = props
  const { t } = useTranslation()
  const width = useSidebarWidthStore((state) => state.width)
  const setWidth = useSidebarWidthStore((state) => state.setWidth)
  const sidebarPanelRef = useRef<HTMLDivElement>(null)

  return (
    <Splitter.Root
      flex="1"
      panels={[
        { id: "sidebar", minSize: `${SIDEBAR_MIN_WIDTH}px`, maxSize: `${SIDEBAR_MAX_WIDTH}px` },
        { id: "content" },
      ]}
      defaultSize={[`${width}px`]}
      onResizeEnd={() => {
        const panelEl = sidebarPanelRef.current
        if (!panelEl) {
          return
        }

        setWidth(Math.round(panelEl.getBoundingClientRect().width))
      }}
    >
      <Splitter.Panel id="sidebar" ref={sidebarPanelRef}>
        {sidebar}
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="sidebar:content" aria-label={t("common.resizeSidebar")} />
      <Splitter.Panel id="content">
        <Stack h="full" overflow="auto" gap="0">
          {children}
        </Stack>
      </Splitter.Panel>
    </Splitter.Root>
  )
}
