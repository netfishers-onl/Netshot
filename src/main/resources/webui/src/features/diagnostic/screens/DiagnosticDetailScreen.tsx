import api from "@/api"
import { Protected } from "@/components"
import { LuChevronDown, LuPower, LuPencil, LuTrash } from "react-icons/lu"
import { DiagnosticType, Level } from "@/types"
import {
  Button,
  Flex,
  Heading,
  Menu,
  Portal,
  Separator,
  Skeleton,
  Spacer,
  Stack,
  Tag,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import DiagnosticDisableButton from "../components/DiagnosticDisableButton"
import DiagnosticEditButton from "../components/DiagnosticEditButton"
import DiagnosticEnableButton from "../components/DiagnosticEnableButton"
import DiagnosticRemoveButton from "../components/DiagnosticRemoveButton"
import ScriptDiagnosticDetail from "../components/ScriptDiagnosticDetail"
import TextDiagnosticDetail from "../components/TextDiagnosticDetail"
import { QUERIES } from "../constants"
import { DiagnosticProvider } from "../contexts"

export default function DeviceDetailScreen() {
  const { id } = useParams()
  const { t } = useTranslation()

  const { data: diagnostic, isPending } = useQuery({
    queryKey: [QUERIES.DIAGNOSTIC_DETAIL, +id],
    queryFn: async () => api.diagnostic.getById(+id),
  })

  return (
    <DiagnosticProvider diagnostic={diagnostic} isLoading={isPending} key={id}>
      <Stack p="9" gap="6" flex="1">
        <Flex alignItems="center">
          <Skeleton loading={isPending}>
            <Stack direction="row" gap="3" alignItems="center">
              <Heading as="h1" fontSize="4xl">
                {diagnostic?.name ?? "Network device title"}
              </Heading>
              {diagnostic && !diagnostic?.enabled && (
                <Tag.Root colorPalette="grey" variant="surface">{t("common.disabled")}</Tag.Root>
              )}
            </Stack>
          </Skeleton>

          <Spacer />

          <Protected minLevel={Level.ReadWrite}>
            <Stack direction="row" gap="3">
              <Skeleton loading={isPending}>
                <DiagnosticEditButton
                  diagnostic={diagnostic}
                  renderItem={(open) => (
                    <Button variant="primary" onClick={open}>
                      <LuPencil />
                      {t("common.edit")}
                    </Button>
                  )}
                />
              </Skeleton>

              <Menu.Root>
                <Skeleton loading={isPending}>
                  <Menu.Trigger asChild>
                    <Button>
                      {t("common.actions")}
                      <LuChevronDown />
                    </Button>
                  </Menu.Trigger>
                </Skeleton>

                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      {diagnostic && (
                        <>
                          {diagnostic.enabled ? (
                            <DiagnosticDisableButton
                              diagnostic={diagnostic}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="disable">
                                  <LuPower />
                                  {t("common.disable")}
                                </Menu.Item>
                              )}
                            />
                          ) : (
                            <DiagnosticEnableButton
                              diagnostic={diagnostic}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="enable">
                                  <LuPower />
                                  {t("common.enable")}
                                </Menu.Item>
                              )}
                            />
                          )}

                          <DiagnosticRemoveButton
                            diagnostic={diagnostic}
                            renderItem={(open) => (
                              <Menu.Item onSelect={open} value="remove" color="fg.error" _hover={{ bg: "bg.error", color: "fg.error" }}>
                                <LuTrash />
                                {t("common.remove")}
                              </Menu.Item>
                            )}
                          />
                        </>
                      )}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </Stack>
          </Protected>
        </Flex>
        <Separator />
        {diagnostic?.type === DiagnosticType.Simple && <TextDiagnosticDetail />}
        {(diagnostic?.type === DiagnosticType.Javascript ||
          diagnostic?.type === DiagnosticType.Python) && (
          <ScriptDiagnosticDetail />
        )}
      </Stack>
    </DiagnosticProvider>
  )
}
