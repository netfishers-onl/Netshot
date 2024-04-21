import { Diagnostic, DiagnosticType } from "@/types";
import { Stack, Tag, Text } from "@chakra-ui/react";
import { LegacyRef, forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

type DiagnosticBoxProps = {
  diagnostic: Diagnostic;
};

export default forwardRef(
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
            px="4"
            py="6"
            spacing="3"
            border="1px"
            borderColor={isActive ? "transparent" : "grey.100"}
            bg={isActive ? "green.50" : "white"}
            borderRadius="xl"
            boxShadow="sm"
            ref={ref}
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
