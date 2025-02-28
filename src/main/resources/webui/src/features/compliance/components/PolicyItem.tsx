import { Icon, Protected } from "@/components";
import { Level, Policy } from "@/types";
import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { motion, useAnimationControls } from "framer-motion";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AddRuleButton from "./AddRuleButton";
import EditPolicyButton from "./EditPolicyButton";
import RemovePolicyButton from "./RemovePolicyButton";
import RuleItem from "./RuleItem";

export type PolicyItemProps = {
  policy: Policy;
};

export default function PolicyItem(props: PolicyItemProps) {
  const { policy } = props;
  const { t } = useTranslation();
  const controls = useAnimationControls();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const hasRules = useMemo(() => policy.ruleCount > 0, [policy]);

  const toggleCollapse = useCallback(
    async (evt?: MouseEvent<HTMLDivElement>) => {
      if (!hasRules) {
        return;
      }

      evt?.stopPropagation();
      setIsCollapsed((prev) => !prev);
      await controls.start(isCollapsed ? "show" : "hidden");
    },
    [controls, isCollapsed, hasRules]
  );

  return (
    <Stack spacing="0" mx="-3">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderRadius="lg"
        bg="white"
        height="36px"
        transition="all .2s ease"
        _hover={{
          bg: "grey.50",
        }}
        onClick={toggleCollapse}
        userSelect="none"
        cursor="pointer"
        px="3"
      >
        <Stack
          direction="row"
          spacing="3"
          alignItems="center"
          title={policy?.name}
        >
          <Box flex="0 0 16px">
            <Icon
              name="chevronDown"
              color="grey.500"
              sx={{
                transform: isCollapsed ? "rotate(-90deg)" : "",
              }}
              opacity={hasRules ? 1 : 0}
            />
          </Box>

          <Box flex="0 0 16px">
            <Icon name="folder" color="green.600" />
          </Box>
          <Text noOfLines={1}>{policy?.name}</Text>
        </Stack>
        <Protected
          roles={[
            Level.Admin,
            Level.Operator,
            Level.ReadWriteCommandOnDevice,
            Level.ReadWrite,
          ]}
        >
          <Menu>
            <MenuButton
              as={IconButton}
              variant="ghost"
              icon={<Icon name="moreHorizontal" />}
              size="sm"
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList>
              <AddRuleButton
                policy={policy}
                renderItem={(open) => (
                  <MenuItem onClick={open} icon={<Icon name="plus" />}>
                    {t("Add rule")}
                  </MenuItem>
                )}
              />
              <EditPolicyButton
                policy={policy}
                renderItem={(open) => (
                  <MenuItem onClick={open} icon={<Icon name="edit" />}>
                    {t("Edit")}
                  </MenuItem>
                )}
              />
              <RemovePolicyButton
                policy={policy}
                renderItem={(open) => (
                  <MenuItem onClick={open} icon={<Icon name="trash" />}>
                    {t("Remove")}
                  </MenuItem>
                )}
              />
            </MenuList>
          </Menu>
        </Protected>
      </Stack>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, height: 0, pointerEvents: "none" },
          show: {
            opacity: 1,
            height: "auto",
            pointerEvents: "all",
          },
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <Stack direction="column" spacing="0">
          {policy.rules?.map((rule) => (
            <RuleItem key={rule?.id} policy={policy} rule={rule} />
          ))}
        </Stack>
      </motion.div>
    </Stack>
  );
}
