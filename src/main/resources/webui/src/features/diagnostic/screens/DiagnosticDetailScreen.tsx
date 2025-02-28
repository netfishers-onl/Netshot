import api from "@/api";
import { MonacoEditor, Protected } from "@/components";
import Icon from "@/components/Icon";
import { useToast } from "@/hooks";
import { useColor } from "@/theme";
import { DiagnosticType, Level } from "@/types";
import {
  Box,
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import DiagnosticDisableButton from "../components/DiagnosticDisableButton";
import DiagnosticEditButton from "../components/DiagnosticEditButton";
import DiagnosticEnableButton from "../components/DiagnosticEnableButton";
import DiagnosticRemoveButton from "../components/DiagnosticRemoveButton";
import { QUERIES } from "../constants";
import { DiagnosticProvider } from "../contexts";

export default function DeviceDetailScreen() {
  const { id } = useParams();
  const { t } = useTranslation();
  const toast = useToast();
  const { data: diagnostic, isLoading } = useQuery(
    [QUERIES.DIAGNOSTIC_DETAIL, +id],
    async () => api.diagnostic.getById(+id),
    {
      onError() {
        toast.error({
          title: t("Error"),
          description: t("An error occured"),
        });
      },
    }
  );

  const tagBorderColor = useColor("grey.200");

  return (
    <DiagnosticProvider diagnostic={diagnostic} isLoading={isLoading}>
      <Stack p="9" spacing="9" flex="1">
        <Flex alignItems="center">
          <Skeleton isLoaded={!isLoading}>
            <Stack direction="row" spacing="3" alignItems="center">
              <Heading as="h1" fontSize="4xl">
                {diagnostic?.name ?? "Network device title"}
              </Heading>
              {diagnostic?.deviceDriver && (
                <Tag
                  variant="outline"
                  color="black"
                  borderColor="grey.200"
                  shadow={`inset 0 0 0px 1px ${tagBorderColor}`}
                >
                  {diagnostic?.deviceDriverDescription}
                </Tag>
              )}
            </Stack>
          </Skeleton>

          <Spacer />

          <Protected
            roles={[
              Level.Admin,
              Level.Operator,
              Level.ReadWriteCommandOnDevice,
            ]}
          >
            <Stack direction="row" spacing="3">
              <Skeleton isLoaded={!isLoading}>
                <DiagnosticEditButton
                  key={diagnostic?.id}
                  diagnostic={diagnostic}
                  renderItem={(open) => (
                    <Button variant="primary" onClick={open}>
                      {t("Edit")}
                    </Button>
                  )}
                />
              </Skeleton>

              <Menu>
                <Skeleton isLoaded={!isLoading}>
                  <MenuButton
                    as={Button}
                    rightIcon={<Icon name="moreHorizontal" />}
                  >
                    {t("Actions")}
                  </MenuButton>
                </Skeleton>

                <MenuList>
                  {diagnostic && (
                    <>
                      {diagnostic.enabled ? (
                        <DiagnosticDisableButton
                          diagnostic={diagnostic}
                          renderItem={(open) => (
                            <MenuItem
                              icon={<Icon name="power" />}
                              onClick={open}
                            >
                              {t("Disable")}
                            </MenuItem>
                          )}
                        />
                      ) : (
                        <DiagnosticEnableButton
                          diagnostic={diagnostic}
                          renderItem={(open) => (
                            <MenuItem
                              icon={<Icon name="power" />}
                              onClick={open}
                            >
                              {t("Enable")}
                            </MenuItem>
                          )}
                        />
                      )}

                      <DiagnosticRemoveButton
                        diagnostic={diagnostic}
                        renderItem={(open) => (
                          <MenuItem icon={<Icon name="trash" />} onClick={open}>
                            {t("Remove")}
                          </MenuItem>
                        )}
                      />
                    </>
                  )}
                </MenuList>
              </Menu>
            </Stack>
          </Protected>
        </Flex>
        {diagnostic?.type === DiagnosticType.Simple && (
          <Stack spacing="3">
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("Device type")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text>{diagnostic?.deviceDriverDescription ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("CLI mode")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>{diagnostic?.cliMode}</Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("CLI command")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text fontFamily="mono">{diagnostic?.command ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("RegEx pattern")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text fontFamily="mono">
                  {diagnostic?.modifierPattern ?? "N/A"}
                </Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("Replace with")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text fontFamily="mono">
                  {diagnostic?.modifierReplacement ?? "N/A"}
                </Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box flex="0 0 auto" w="200px">
                <Text color="grey.400">{t("Enabled")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                {diagnostic?.enabled ? (
                  <Tag colorScheme="green">{t("Enabled")}</Tag>
                ) : (
                  <Tag colorScheme="red">{t("Disabled")}</Tag>
                )}
              </Skeleton>
            </Flex>
          </Stack>
        )}

        {diagnostic?.type === DiagnosticType.Javascript && (
          <MonacoEditor
            value={diagnostic?.script}
            language="javascript"
            readOnly
          />
        )}

        {diagnostic?.type === DiagnosticType.Python && (
          <MonacoEditor value={diagnostic?.script} language="python" readOnly />
        )}
      </Stack>
    </DiagnosticProvider>
  );
}
