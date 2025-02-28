import { Icon } from "@/components";
import { transparentize } from "@/theme";
import {
  Flex,
  Stack,
  StackProps,
  SystemStyleInterpolation,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";

export type BoxButtonProps = {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
} & StackProps;

export default function BoxButton(props: BoxButtonProps) {
  const { icon, title, description, isActive, ...other } = props;

  const styles = useMemo(() => {
    const styles = {
      borderRadius: "2xl",
      borderWidth: "1px",
      borderColor: "grey.100",
      p: "7",
      flex: "1",
      transform: "translate3d(0, 0, 0)",
      cursor: "pointer",
      transition: "all .2s ease",
      outline: "3px solid transparent",
      _hover: {
        transform: "translate3d(0, -1.2px, 0)",
      },
      _active: {
        transform: "translate3d(0, 0, 0)",
      },
    } as SystemStyleInterpolation;

    if (!isActive) {
      return styles;
    }

    return {
      ...styles,
      borderColor: "green.400",
      outlineColor: transparentize("green.400", 0.1),
    } as Partial<SystemStyleInterpolation>;
  }, [isActive]);

  return (
    <Stack spacing="5" {...styles} {...other}>
      <Flex
        w="48px"
        h="48px"
        alignItems="center"
        justifyContent="center"
        bg="green.50"
        borderRadius="xl"
      >
        <Icon size={24} name={icon} color="green.800" />
      </Flex>
      <Stack spacing="1">
        <Text fontWeight="semibold">{title}</Text>
        <Text color="grey.400">{description}</Text>
      </Stack>
    </Stack>
  );
}
