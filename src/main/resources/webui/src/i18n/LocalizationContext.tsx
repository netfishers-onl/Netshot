import { getLocalTimeZone } from "@internationalized/date"
import { createContext, useContext, useState, type ReactNode } from "react"

interface LocalizationContextValue {
  timezone: string
  setTimezone: (tz: string) => void
}

const LocalizationContext = createContext<LocalizationContextValue>({
  timezone: getLocalTimeZone(),
  setTimezone: () => {},
})

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezone] = useState(getLocalTimeZone)
  return (
    <LocalizationContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </LocalizationContext.Provider>
  )
}

export function useTimezone() {
  return useContext(LocalizationContext)
}
