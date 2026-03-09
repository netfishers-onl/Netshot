import { MouseEvent, ReactElement } from "react"

export type PropsWithRenderItem<T = object> = T & {
  renderItem(open: (evt?: MouseEvent<HTMLButtonElement>) => void): ReactElement
}
