import { Tooltip } from "@/components/ui/tooltip"
import { IconButton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuPen, LuPenOff } from "react-icons/lu"

export type BulkEditLockToggleProps = {
  /** True while the field is left unchanged on all selected devices (default). */
  locked: boolean
  onToggle(): void
}

/** Pen/pen-off toggle placed next to a bulk-edit field's label: locked (pen-off) leaves the field untouched on every selected device, unlocked (pen) arms it for a new value to be applied to all of them. */
export default function BulkEditLockToggle({ locked, onToggle }: BulkEditLockToggleProps) {
  const { t } = useTranslation()
  const tooltip = locked ? t("device.bulkFieldClickToEdit") : t("device.bulkFieldUnchangedTooltip")

  return (
    <Tooltip content={tooltip} positioning={{ placement: "top" }}>
      <span>
        <IconButton
          size="2xs"
          variant="ghost"
          aria-label={tooltip}
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
        >
          {locked ? <LuPenOff /> : <LuPen />}
        </IconButton>
      </span>
    </Tooltip>
  )
}
