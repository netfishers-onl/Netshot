import { Button, Clipboard, CloseButton, FloatingPanel } from "@chakra-ui/react"
import { PropsWithChildren, ReactNode } from "react"
import { LuCopy, LuCopyCheck } from "react-icons/lu"
import { useTranslation } from "react-i18next"

export type LogPanelProps = PropsWithChildren<{
  trigger: ReactNode
  title: string
  copyValue: string
}>

export default function LogPanel(props: LogPanelProps) {
  const { trigger, title, copyValue, children } = props
  const { t } = useTranslation()

  return (
    <FloatingPanel.Root
      defaultSize={{ width: 720, height: 560 }}
      minSize={{ width: 320, height: 200 }}
      closeOnEscape
    >
      <FloatingPanel.Trigger asChild>{trigger}</FloatingPanel.Trigger>
      <FloatingPanel.Positioner>
        <FloatingPanel.Content>
          <FloatingPanel.Header>
            <FloatingPanel.DragTrigger asChild>
              <FloatingPanel.Title>{title}</FloatingPanel.Title>
            </FloatingPanel.DragTrigger>
            <FloatingPanel.Control display="flex" alignItems="center" gap="1" flexShrink={0}>
              <Clipboard.Root value={copyValue}>
                <Clipboard.Trigger asChild>
                  <Button size="xs" variant="frame">
                    <Clipboard.Indicator copied={<LuCopyCheck />}>
                      <LuCopy />
                    </Clipboard.Indicator>
                    {t("common.copy")}
                  </Button>
                </Clipboard.Trigger>
              </Clipboard.Root>
              <FloatingPanel.CloseTrigger asChild>
                <CloseButton size="xs" />
              </FloatingPanel.CloseTrigger>
            </FloatingPanel.Control>
          </FloatingPanel.Header>
          <FloatingPanel.Body>{children}</FloatingPanel.Body>
          <FloatingPanel.ResizeTriggers />
        </FloatingPanel.Content>
      </FloatingPanel.Positioner>
    </FloatingPanel.Root>
  )
}
