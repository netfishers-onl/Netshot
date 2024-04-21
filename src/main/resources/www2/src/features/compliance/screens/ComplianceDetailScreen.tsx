import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { MonacoEditor } from "@/components";
import Icon from "@/components/Icon";
import { useToast } from "@/hooks";
import { useColor } from "@/theme";
import { RuleType } from "@/types";
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
import { useNavigate, useParams } from "react-router-dom";
import DisableRuleButton from "../components/DisableRuleButton";
import EditRuleButton from "../components/EditRuleButton";
import EditRuleExemptedDeviceButton from "../components/EditRuleExemptedDeviceButton";
import EnableRuleButton from "../components/EnableRuleButton";
import RuleRemoveButton from "../components/RemoveRuleButton";
import { QUERIES } from "../constants";
import { RuleProvider } from "../contexts";

export default function ComplianceDetailScreen() {
  const { policyId, ruleId } = useParams();
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: rule, isLoading } = useQuery(
    [QUERIES.RULE_DETAIL, +policyId, +ruleId],
    async () => api.rule.getById(+policyId, +ruleId),
    {
      onError(err: NetshotError) {
        toast.error(err);
        navigate("/app/compliance");
      },
    }
  );

  const tagBorderColor = useColor("grey.200");

  return (
    <RuleProvider rule={rule} isLoading={isLoading}>
      <Stack p="9" spacing="9" flex="1">
        <Flex alignItems="center">
          <Skeleton isLoaded={!isLoading}>
            <Stack direction="row" spacing="3" alignItems="center">
              <Heading as="h1" fontSize="4xl">
                {rule?.name ?? "Rule title"}
              </Heading>
              {rule?.deviceDriver && (
                <Tag
                  variant="outline"
                  color="black"
                  borderColor="grey.200"
                  shadow={`inset 0 0 0px 1px ${tagBorderColor}`}
                >
                  {rule?.deviceDriverDescription}
                </Tag>
              )}
            </Stack>
          </Skeleton>

          <Spacer />
          <Stack direction="row" spacing="3">
            <Skeleton isLoaded={!isLoading}>
              {rule && (
                <EditRuleButton
                  key={rule?.id}
                  policyId={+policyId}
                  rule={rule}
                  renderItem={(open) => (
                    <Button variant="primary" onClick={open}>
                      {t("Edit")}
                    </Button>
                  )}
                />
              )}
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

              <MenuList key={rule?.id}>
                {rule && (
                  <>
                    <EditRuleExemptedDeviceButton
                      policyId={+policyId}
                      rule={rule}
                      renderItem={(open) => (
                        <MenuItem
                          type="button"
                          onClick={open}
                          icon={<Icon name="server" />}
                        >
                          {t("Exempted devices")}
                        </MenuItem>
                      )}
                    />
                    {rule?.enabled ? (
                      <DisableRuleButton
                        policyId={+policyId}
                        rule={rule}
                        renderItem={(open) => (
                          <MenuItem
                            type="button"
                            onClick={open}
                            icon={<Icon name="power" />}
                          >
                            {t("Disable")}
                          </MenuItem>
                        )}
                      />
                    ) : (
                      <EnableRuleButton
                        policyId={+policyId}
                        rule={rule}
                        renderItem={(open) => (
                          <MenuItem
                            type="button"
                            onClick={open}
                            icon={<Icon name="power" />}
                          >
                            {t("Enable")}
                          </MenuItem>
                        )}
                      />
                    )}

                    <RuleRemoveButton
                      policyId={+policyId}
                      rule={rule}
                      renderItem={(open) => (
                        <MenuItem
                          type="button"
                          onClick={open}
                          icon={<Icon name="trash" />}
                        >
                          {t("Remove")}
                        </MenuItem>
                      )}
                    />
                  </>
                )}
              </MenuList>
            </Menu>
          </Stack>
        </Flex>
        {rule?.type === RuleType.Text && (
          <Stack spacing="3">
            <Flex alignItems="center">
              <Box w="200px">
                <Text color="grey.400">{t("Device type")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text>{rule?.deviceDriverDescription ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box w="200px">
                <Text color="grey.400">{t("Field to check")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text>{rule?.field ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box w="200px">
                <Text color="grey.400">{t("Context")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text fontFamily="mono">{rule?.context ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
            <Flex alignItems="center">
              <Box w="200px">
                <Text color="grey.400">{t("Must not contain")}</Text>
              </Box>
              <Skeleton isLoaded={!isLoading}>
                <Text fontFamily="mono">{rule?.text ?? "N/A"}</Text>
              </Skeleton>
            </Flex>
          </Stack>
        )}

        {rule?.type === RuleType.Javascript && (
          <MonacoEditor
            key={rule?.script}
            value={rule?.script}
            language="javascript"
            readOnly
          />
        )}

        {rule?.type === RuleType.Python && (
          <MonacoEditor
            key={rule?.script}
            value={rule?.script}
            language="python"
            readOnly
          />
        )}
      </Stack>
    </RuleProvider>
  );
}
