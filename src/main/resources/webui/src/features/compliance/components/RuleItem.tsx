import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { Icon, Protected } from "@/components";
import { Level, Policy, Rule, RuleType } from "@/types";

import DisableRuleButton from "./DisableRuleButton";
import EditRuleButton from "./EditRuleButton";
import EnableRuleButton from "./EnableRuleButton";
import RemoveRuleButton from "./RemoveRuleButton";

export type RuleItemProps = {
  policy: Policy;
  rule: Rule;
};

export default function RuleItem(props: RuleItemProps) {
  const { policy, rule } = props;
  const { t } = useTranslation();
  const { policyId, ruleId } = useParams();
  const navigate = useNavigate();

  const iconName = useMemo(() => {
    if (rule.type === RuleType.Javascript) {
      return "javascript";
    }
    else if (rule.type === RuleType.Python) {
      return "python";
    }
    else {
      return "alignLeft";
    }
  }, [rule]);

  const isActive = useMemo(
    () => +policyId === policy.id && +ruleId === rule.id,
    [policyId, policy, ruleId, rule]
  );

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      borderRadius="md"
      height="36px"
      bg={isActive ? "green.50" : "white"}
      transition="all .2s ease"
      _hover={{
        bg: isActive ? "green.50" : "grey.50",
      }}
      userSelect="none"
      cursor="pointer"
      pr="3"
      pl="10"
      onClick={() => navigate(`./config/${policy?.id}/${rule?.id}`)}
    >
      <Stack direction="row" spacing="3" alignItems="center">
        <Icon name={iconName} color="green.600" />
        <Text noOfLines={1}>{rule?.name}</Text>
      </Stack>
      <Protected minLevel={Level.Operator}>
        <Menu>
          <MenuButton
            as={IconButton}
            variant="ghost"
            icon={<Icon name="moreHorizontal" />}
            size="sm"
          />
          <MenuList>
            <EditRuleButton
              policyId={policy.id}
              rule={rule}
              renderItem={(open) => (
                <MenuItem
                  type="button"
                  onClick={open}
                  icon={<Icon name="edit" />}
                >
                  {t("Edit")}
                </MenuItem>
              )}
            />
            {rule?.enabled ? (
              <DisableRuleButton
                policyId={policy.id}
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
                policyId={policy.id}
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
            <RemoveRuleButton
              policyId={policy.id}
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
          </MenuList>
        </Menu>
      </Protected>
    </Stack>
  );
}
