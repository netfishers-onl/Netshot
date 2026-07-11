import { DeviceGroupBadge, QueryBuilderTrigger } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { IconButton, Input, InputGroup, Popover, Portal, Stack } from "@chakra-ui/react"
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass, LuSearch, LuX } from "react-icons/lu"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { useShallow } from "zustand/react/shallow"
import { useDeviceSidebarStore } from "../../stores"
import DeviceSidebarGroup from "./DeviceSidebarGroup"
import { useDeviceGroupTree } from "./useDeviceGroupTree"

function buildQuery(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith("[")) return trimmed
  return `[Name] CONTAINSNOCASE "${trimmed}"`
}

export default function DeviceSidebarSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const { query, driver, group, deselectAll, setQuery, setGroup, updateQueryAndDriver } =
    useDeviceSidebarStore(
      useShallow((state) => ({
        query: state.query,
        driver: state.driver,
        group: state.group,
        deselectAll: state.deselectAll,
        setQuery: state.setQuery,
        setGroup: state.setGroup,
        updateQueryAndDriver: state.updateQueryAndDriver,
      }))
    )

  const [text, setText] = useState<string>(() => searchParams.get("q") ?? "")
  const [isOpen, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { items, isPending, selectedGroupId, onGroupSelect, isFolderOpen, toggleFolderOpen } =
    useDeviceGroupTree({
      enabled: isOpen,
      onAfterSelect: () => setOpen(false),
    })

  const q = searchParams.get("q")

  // Hydrate the search state from "?q=" (initial load, or browser back/forward)
  useEffect(() => {
    if (!q) return
    setText(q)
    setQuery(buildQuery(q))
  }, [q])

  // Selecting a group clears any text/advanced search shown in the box
  useEffect(() => {
    if (group) setText("")
  }, [group])

  function runSearch(value: string) {
    deselectAll()
    setGroup(null)

    if (!value.trim()) {
      updateQueryAndDriver("", null)
      navigate({ pathname: location.pathname, search: null }, { replace: true })
      return
    }

    setQuery(buildQuery(value))
    navigate(
      { pathname: location.pathname, search: `?q=${encodeURIComponent(value)}` },
      { replace: true }
    )
  }

  function handleChange(evt: ChangeEvent<HTMLInputElement>) {
    if (group) {
      setGroup(null)
      navigate({ pathname: location.pathname, search: null }, { replace: true })
    }
    setText(evt.target.value)
  }

  function handleKeyDown(evt: KeyboardEvent<HTMLInputElement>) {
    if (evt.key !== "Enter") return
    runSearch(text)
    setOpen(false)
  }

  function handleClear() {
    setText("")
    setGroup(null)
    updateQueryAndDriver("", null)
    setQuery("")
    navigate({ pathname: location.pathname, search: null }, { replace: true })
    inputRef.current?.focus()
  }

  return (
    <Stack p="6" gap="5">
      <Popover.Root
        open={isOpen}
        onOpenChange={(details) => setOpen(details.open)}
        autoFocus={false}
        positioning={{ placement: "bottom" }}
      >
        <Popover.Anchor>
          <InputGroup
            startElement={
              group ? <DeviceGroupBadge id={group.id} name={group.name} /> : <LuSearch size={18} />
            }
            endElement={
              <>
                <Tooltip content={t("common.queryBuilder")}>
                  <QueryBuilderTrigger
                    value={{ query, driver }}
                    onSubmit={(res) => {
                      setGroup(null)
                      updateQueryAndDriver(res.query, res.driver)
                      setText(res.query ?? "")
                      navigate(
                        {
                          pathname: location.pathname,
                          search: res.query ? `?q=${encodeURIComponent(res.query)}` : null,
                        },
                        { replace: true }
                      )
                      setOpen(false)
                    }}
                  >
                    <IconButton size="xs" variant="ghost" aria-label={t("common.openQueryBuilder")}>
                      <LuCompass />
                    </IconButton>
                  </QueryBuilderTrigger>
                </Tooltip>
                {(Boolean(text) || Boolean(group)) && (
                  <IconButton size="xs" variant="ghost" aria-label={t("common.clear")} onClick={handleClear}>
                    <LuX />
                  </IconButton>
                )}
              </>
            }
          >
            <Input
              ref={inputRef}
              variant="outline"
              value={group ? "" : text}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={group ? "" : t("device.searchOrGroupPlaceholder")}
            />
          </InputGroup>
        </Popover.Anchor>

        <Portal>
          <Popover.Positioner>
            <Popover.Content w="260px">
              <DeviceSidebarGroup
                items={items}
                isPending={isPending}
                selectedGroupId={selectedGroupId}
                onGroupSelect={onGroupSelect}
                isFolderOpen={isFolderOpen}
                toggleFolderOpen={toggleFolderOpen}
              />
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Stack>
  )
}
