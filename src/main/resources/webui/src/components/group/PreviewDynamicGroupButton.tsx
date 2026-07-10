import api, { DeviceSearchResult } from "@/api"
import { NetshotError } from "@/api/httpClient"
import { DeviceListItem } from "@/features/device/components"
import { Button, Popover, Separator, Stack, Stat, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { ComponentProps, forwardRef, useEffect } from "react"
import { Trans, useTranslation } from "react-i18next"
import { LuScanSearch } from "react-icons/lu"

export type PreviewDynamicGroupButtonProps = {
  query: string
}

const PREVIEW_LIMIT = 5

type DevicesFoundStatProps = { count: number } & Omit<ComponentProps<typeof Stat.Root>, "children">

const DevicesFoundStat = forwardRef<HTMLDListElement, DevicesFoundStatProps>(
  ({ count, ...rootProps }, ref) => {
    const { t } = useTranslation()

    return (
      <Stat.Root ref={ref} alignSelf="center" {...rootProps}>
        <Stat.ValueText alignItems="baseline">
          <Trans
            t={t}
            i18nKey="device.devicesFound"
            count={count}
            components={{ unit: <Stat.ValueUnit /> }}
          />
        </Stat.ValueText>
      </Stat.Root>
    )
  }
)

export default function PreviewDynamicGroupButton(props: PreviewDynamicGroupButtonProps) {
  const { query } = props
  const { t } = useTranslation()

  const mutation = useMutation<DeviceSearchResult, NetshotError>({
    mutationFn: async () => api.device.search({ query }),
  })

  // Query changed since the last preview: drop the stale result rather than show it as current
  useEffect(() => {
    mutation.reset()
  }, [query])

  const error = mutation.error
  const devices = mutation.data?.devices ?? []
  const count = devices.length
  const preview = devices.slice(0, PREVIEW_LIMIT)
  const remaining = count - preview.length

  return (
    <Stack gap="3">

      {mutation.isError && (
        <Text fontSize="xs" color="red.fg">
          {error?.description ?? t("common.anErrorOccurred")}
        </Text>
      )}

      {mutation.isSuccess && (
        count > 0 ? (
          <Popover.Root positioning={{ placement: "top-start" }}>
            <Popover.Trigger asChild>
              <DevicesFoundStat count={count} cursor="pointer" />
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content w="xs">
                <Popover.Arrow />
                <Popover.Body>
                  <Stack gap="3">
                    {preview.map((device) => (
                      <DeviceListItem device={device} key={device.id} />
                    ))}
                    {remaining > 0 && (
                      <>
                        <Separator />
                        <Text fontSize="xs" color="fg.muted">
                          {t("device.andMoreCount", { count: remaining })}
                        </Text>
                      </>
                    )}
                  </Stack>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Root>
        ) : (
          <DevicesFoundStat count={count} />
        )
      )}

      <Button
        variant="outline"
        disabled={!query}
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        <LuScanSearch />
        {t("group.previewMembers")}
      </Button>
    </Stack>
  )
}
