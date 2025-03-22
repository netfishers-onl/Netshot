import { Stack, Tag, Text } from "@chakra-ui/react";
import { forwardRef, LegacyRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import { Diagnostic, DiagnosticType } from "@/types";

type DiagnosticBoxProps = {
  diagnostic: Diagnostic;
};

const SidebarBox = forwardRef(
  (props: DiagnosticBoxProps, ref: LegacyRef<HTMLDivElement>) => {
    const { diagnostic } = props;
    const { t } = useTranslation();

    const type = useMemo(() => {
      if (diagnostic.type === DiagnosticType.Simple) {
        return t("Simple");
      } else if (diagnostic.type === DiagnosticType.Javascript) {
        return t("Javascript");
      } else if (diagnostic.type === DiagnosticType.Python) {
        return t("Python");
      } else {
        return t("Unknown");
      }
    }, [diagnostic]);

    return (
      <NavLink to={`./${diagnostic?.id}`}>
        {({ isActive }) => (
          <Stack
            px="2"
            py="2"
            spacing="1"
            bg={isActive ? "green.50" : "white"}
            transition="all .2s ease"
            _hover={{
              bg: isActive ? "green.50" : "grey.50",
            }}
            borderRadius="xl"
            ref={ref}
            opacity={diagnostic?.enabled ? 1 : 0.5}
          >
            <Stack spacing="0">
              <Text fontWeight="medium">{diagnostic?.name}</Text>
              <Text fontSize="xs" color={isActive ? "green.500" : "grey.400"}>
                {type}
              </Text>
            </Stack>
            <Stack direction="row" spacing="2">
              {diagnostic?.targetGroup && (
                <Tag colorScheme={isActive ? "green" : "grey"}>
                  {diagnostic?.targetGroup?.name}
                </Tag>
              )}
              <Tag colorScheme={diagnostic?.enabled ? "green" : "red"}>
                {diagnostic?.enabled ? t("Enabled") : t("Disabled")}
              </Tag>
            </Stack>
          </Stack>
        )}
      </NavLink>
    );
  }
);

export default SidebarBox;
