import { Box, BoxProps, IconButton, Input, InputGroup } from "@chakra-ui/react"
import { ChangeEvent, PropsWithChildren, useRef, useState } from "react"
import { Search as SearchIcon, X } from "react-feather"

/**
 * @todo: Add useThrottle
 */
export type SearchProps = PropsWithChildren<
  {
    clear?: boolean
    onQuery(query: string): void
    onClear?(): void
    placeholder: string
    isDisabled?: boolean
  } & BoxProps
>

export default function Search(props: SearchProps) {
  const {
    clear = false,
    onQuery,
    onClear,
    placeholder,
    children,
    isDisabled = false,
    ...other
  } = props
  const [innerValue, setInnerValue] = useState<string>("")
  const ref = useRef<HTMLInputElement>(null)

  function clearValue() {
    setInnerValue("")
    ref.current.focus()

    setTimeout(() => {
      if (onClear) onClear()
    })
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setInnerValue(e.target.value)

    setTimeout(() => {
      if (onQuery) onQuery(e.target.value)
    })
  }

  const hasClear = innerValue?.length > 0 || clear

  return (
    <Box {...other}>
      <InputGroup
        startElement={<SearchIcon size={18} />}
        endElement={
          <>
            {children}
            {hasClear && (
              <IconButton
                variant="ghost"
                colorPalette="gray"
                aria-label="Clear"
                onClick={clearValue}
              >
                <X />
              </IconButton>
            )}
          </>
        }
      >
        <Input
          variant="outline"
          ref={ref}
          value={String(innerValue)}
          disabled={isDisabled}
          onChange={handleChange}
          placeholder={placeholder}
        />
      </InputGroup>
    </Box>
  )
}
