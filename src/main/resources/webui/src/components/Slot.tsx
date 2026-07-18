import { cloneElement, ReactElement } from "react"

export type SlotProps = {
  children: ReactElement<Record<string, unknown>>
  onTrigger: (evt?: unknown) => void
} & Record<string, unknown>

/**
 * Injects a click/select handler into an arbitrary caller-supplied trigger
 * element (button, menu item, ...). Menu items fire `onSelect` instead of
 * `onClick`, so the handler is attached under whichever prop the child
 * actually consumes.
 */
export default function Slot(props: SlotProps) {
  const { children, onTrigger, ...rest } = props
  const isMenuItem = "value" in children.props

  // eslint-disable-next-line @eslint-react/no-clone-element -- shared trigger-injection primitive used by every *Trigger component; clones the caller-supplied child once here instead of duplicating cloneElement in each of them
  return cloneElement(children, isMenuItem ? { onSelect: onTrigger, ...rest } : { ...rest, onClick: onTrigger })
}
