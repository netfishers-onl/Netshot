import api from "@/api"
import { Protected } from "@/components"
import { LuChevronDown, LuPower, LuPencil, LuTrash } from "react-icons/lu"
import { DiagnosticType, Level } from "@/types"
import {
  Box,
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
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import DisableDiagnosticButton from "../components/DisableDiagnosticButton"
import EditDiagnosticButton from "../components/EditDiagnosticButton"
import EnableDiagnosticButton from "../components/EnableDiagnosticButton"
import RemoveDiagnosticButton from "../components/RemoveDiagnosticButton"
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
                {diagnostic?.name ?? t("common.networkDeviceTitle")}
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
                <EditDiagnosticButton
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
                            <DisableDiagnosticButton
                              diagnostic={diagnostic}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="disable">
                                  <LuPower />
                                  {t("common.disable")}
                                </Menu.Item>
                              )}
                            />
                          ) : (
                            <EnableDiagnosticButton
                              diagnostic={diagnostic}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="enable">
                                  <LuPower />
                                  {t("common.enable")}
                                </Menu.Item>
                              )}
                            />
                          )}

                          <RemoveDiagnosticButton
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
        <Stack gap="3">
          <Flex>
            <Box flex="0 0 auto" w="240px">
              <Text color="grey.400">{t("common.targetGroup")}</Text>
            </Box>
            <Skeleton loading={isPending}>
              {diagnostic?.targetGroup ? (
                <Tag.Root variant="surface">
                  <Tag.Label>{diagnostic.targetGroup.name}</Tag.Label>
                </Tag.Root>
              ) : (
                <Text color="grey.400">—</Text>
              )}
            </Skeleton>
          </Flex>
        </Stack>
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
