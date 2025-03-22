import api from "@/api";
import { Icon } from "@/components";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { useToast } from "@/hooks";
import { Script } from "@/types";
import {
  IconButton,
  Stack,
  StackProps,
  SystemStyleObject,
  Tag,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MouseEvent, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export type DeviceScriptItemProps = {
  isSelected?: boolean;
  script: Script;
} & StackProps;

export default function DeviceScriptItem(props: DeviceScriptItemProps) {
  const { isSelected, script, ...other } = props;

  const toast = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const selectedStyle = useMemo(() => {
    if (!isSelected) {
      return {};
    }

    return {
      borderColor: "green.500",
    } as SystemStyleObject;
  }, [isSelected]);

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: api.script.remove,
    onSuccess() {
      toast.success({
        title: t("Success"),
        description: t("Device script was successfully removed"),
      });

      removeDialog.close();

      queryClient.invalidateQueries({ queryKey: [QUERIES.SCRIPT_LIST] });
    },
    onError() {
      toast.error({
        title: t("Error"),
        description: t("An error occurred during remove"),
      });
    },
  });

  const removeDialog = Dialog.useConfirm({
    title: t("Remove device script"),
    description: (
      <Text>
        {t("You are about to remove the script ")}{" "}
        <Text fontWeight="semibold" as="span">
          {script.name}?
        </Text>
      </Text>
    ),
    isLoading,
    onConfirm() {
      mutate(script?.id);
    },
    confirmButton: {
      label: t("Remove"),
      props: {
        colorScheme: "red",
      },
    },
  });

  const open = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.stopPropagation();
      removeDialog.open();
    },
    [removeDialog]
  );

  return (
    <Stack
      position="relative"
      spacing="2"
      p="4"
      borderColor="grey.100"
      borderWidth="1px"
      borderRadius="2xl"
      bg="white"
      cursor="pointer"
      transition="all .2s ease"
      _hover={{
        "& .chakra-button": {
          opacity: 1,
        },
      }}
      sx={selectedStyle}
      {...other}
    >
      <Text fontWeight="semibold">{script?.name}</Text>
      <Stack direction="row" spacing="4">
        <Tag colorScheme="grey">{script?.deviceDriver}</Tag>
        <Tag colorScheme="green">{script?.author}</Tag>
      </Stack>
      <Tooltip label={t("Remove script")}>
        <IconButton
          position="absolute"
          top="4"
          right="4"
          opacity="0"
          transition="all .2s ease"
          size="sm"
          aria-label={t("Remove device script")}
          icon={<Icon name="trash" />}
          onClick={open}
          variant="ghost"
          colorScheme="green"
        />
      </Tooltip>
    </Stack>
  );
}
