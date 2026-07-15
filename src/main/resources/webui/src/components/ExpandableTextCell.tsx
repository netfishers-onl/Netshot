import { IconButton, Stack, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuMaximize2 } from "react-icons/lu"
import LogPanel from "./LogPanel"

const LONG_VALUE_THRESHOLD = 80

export type ExpandableTextCellProps = {
  value: string
  title: string
  emptyLabel?: string
}

export default function ExpandableTextCell(props: ExpandableTextCellProps) {
  const { value, title, emptyLabel = "" } = props
  const { t } = useTranslation()

  if (!value) {
    return <Text>{emptyLabel}</Text>
  }

  const isMultiline = value.includes("\n")
  const preview = isMultiline ? value.split("\n")[0] : value
  const isLong = isMultiline || value.length > LONG_VALUE_THRESHOLD

  return (
    <Stack direction="row" alignItems="center" gap="2" minW="0">
      <Text
        fontFamily="mono"
        fontSize="sm"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        minW="0"
      >
        {preview}
        {isMultiline && "…"}
      </Text>
      {isLong && (
        <LogPanel
          title={title}
          copyValue={value}
          trigger={
            <IconButton aria-label={t("common.expand")} size="xs" variant="frame" flexShrink={0}>
              <LuMaximize2 />
            </IconButton>
          }
        >
          <Text fontFamily="mono" fontSize="sm" whiteSpace="pre-wrap">
            {value}
          </Text>
        </LogPanel>
      )}
    </Stack>
  )
}
