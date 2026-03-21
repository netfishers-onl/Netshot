import api from "@/api"
import { MonacoEditor, Protected } from "@/components"
import Icon from "@/components/Icon"
import { DiagnosticType, Level } from "@/types"
import {
  Badge,
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
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import DiagnosticDisableButton from "../components/DiagnosticDisableButton"
import DiagnosticEditButton from "../components/DiagnosticEditButton"
import DiagnosticEnableButton from "../components/DiagnosticEnableButton"
import DiagnosticRemoveButton from "../components/DiagnosticRemoveButton"
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
                      {t("edit")}
                    </Button>
                  )}
                />
              </Skeleton>

              <Menu.Root>
                <Skeleton loading={isPending}>
                  <Menu.Trigger asChild>
                    <Button>
                      {t("actions")}
                      <Icon name="moreHorizontal" />
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
                                  <Icon name="power" />
                                  {t("disable")}
                                </Menu.Item>
                              )}
                            />
                          ) : (
                            <DiagnosticEnableButton
                              diagnostic={diagnostic}
                              renderItem={(open) => (
                                <Menu.Item onSelect={open} value="enable">
                                  <Icon name="power" />
                                  {t("enable")}
                                </Menu.Item>
                              )}
                            />
                          )}

                          <DiagnosticRemoveButton
                            diagnostic={diagnostic}
                            renderItem={(open) => (
                              <Menu.Item onSelect={open} value="remove">
                                <Icon name="trash" />
                                {t("remove2")}
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
        {diagnostic?.type === DiagnosticType.Simple && (
          <Stack gap="3">
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("deviceType")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text>{diagnostic?.deviceDriverDescription ?? "nA"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("cliMode")}</Text>
              </Box>
              <Skeleton loading={isPending}>{diagnostic?.cliMode}</Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("cliCommand")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text fontFamily="mono">{diagnostic?.command ?? "nA"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("regexPattern")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text fontFamily="mono">{diagnostic?.modifierPattern ?? "nA"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("replaceWith")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                <Text fontFamily="mono">{diagnostic?.modifierReplacement ?? "nA"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("enabled")}</Text>
              </Box>
              <Skeleton loading={isPending}>
                {diagnostic?.enabled ? (
                  <Badge colorPalette="green">{t("enabled")}</Badge>
                ) : (
                  <Badge colorPalette="red">{t("disabled")}</Badge>
                )}
              </Skeleton>
            </Flex>
          </Stack>
        )}

        {diagnostic?.type === DiagnosticType.Javascript && (
          <MonacoEditor value={diagnostic?.script} language="javascript" readOnly />
        )}

        {diagnostic?.type === DiagnosticType.Python && (
          <MonacoEditor value={diagnostic?.script} language="python" readOnly />
        )}
      </Stack>
    </DiagnosticProvider>
  )
}
