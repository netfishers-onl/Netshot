import api from "@/api";
import { NetshotError } from "@/api/httpClient";
import { QUERIES } from "@/constants";
import { Dialog } from "@/dialog";
import { usePagination, useToast } from "@/hooks";
import { Group } from "@/types";
import { createFoldersFromGroups, isGroup } from "@/utils";
import {
  Box,
  FormLabel,
  Skeleton,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { MouseEvent, useCallback, useMemo } from "react";
import {
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { GroupOrFolderItem } from "./group";

type SelectGroupForm = {
  groups: Group[];
  isMulti: boolean;
};

function SelectGroupDialog() {
  const form = useFormContext<SelectGroupForm>();
  const toast = useToast();
  const pagination = usePagination();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups",
    keyName: "customId",
  });

  const isMulti = useWatch({
    control: form.control,
    name: "isMulti",
  });

  const { data: items, isPending } = useQuery({
    queryKey: [QUERIES.DEVICE_GROUPS],
    queryFn: async () => api.group.getAll(pagination),
    select: useCallback(createFoldersFromGroups, []),
  });

  const isSelected = useCallback(
    (group: Group) => {
      return fields.some(
        (field: Group) =>
          field?.name === group.name && field.folder === group.folder
      );
    },
    [fields]
  );

  const onGroupSelect = useCallback(
    (group: Group) => {
      if (!isMulti) {
        form.setValue("groups", [group]);
        return;
      }

      if (isSelected(group)) {
        remove(
          fields.findIndex(
            (field: Group) =>
              field?.name === group.name && field.folder === group.folder
          )
        );
      } else {
        append(group);
      }
    },
    [append, remove, fields, isSelected, isMulti]
  );

  return isPending ? (
    <Stack spacing="3" pb="6">
      <Skeleton height="36px" />
      <Skeleton height="36px" />
      <Skeleton height="36px" />
      <Skeleton height="36px" />
    </Stack>
  ) : (
    <Stack pl="2">
      {items?.map((item) => (
        <GroupOrFolderItem
          item={item}
          key={isGroup(item) ? item?.id : item?.name}
          onGroupSelect={onGroupSelect}
          isSelected={isSelected}
        />
      ))}
    </Stack>
  );
}

export type TreeGroupSelectorProps = {
  label?: string;
  value?: Group[];
  onChange(groups: Group[]): void;
  isMulti?: boolean;
  withAny?: boolean;
};

export default function TreeGroupSelector(props: TreeGroupSelectorProps) {
  const {
    value = [],
    onChange,
    label,
    isMulti = false,
    withAny = false,
  } = props;

  const { t } = useTranslation();

  const form = useForm<SelectGroupForm>({
    defaultValues: {
      groups: value,
      isMulti,
    },
  });

  const dialog = Dialog.useForm({
    title: t("Select groups"),
    description: <SelectGroupDialog />,
    form,
    onSubmit() {
      const values = form.getValues();

      if (onChange) {
        onChange(values.groups);
      }

      dialog.close();
    },
    size: "2xl",
  });

  const { remove } = useFieldArray({
    control: form.control,
    name: "groups",
    keyName: "customId",
  });

  const groups = useWatch({
    control: form.control,
    name: "groups",
  });

  const onRemove = useCallback(
    (evt: MouseEvent<HTMLButtonElement>, index: number) => {
      evt.stopPropagation();

      remove(index);

      if (onChange) {
        const values = form.getValues();
        onChange(values.groups);
      }
    },
    [remove, onChange, form]
  );

  const render = useMemo(
    () =>
      groups.map((group, index) => (
        <Tag colorScheme="grey" key={group?.id}>
          <TagLabel>{group?.name}</TagLabel>
          <TagCloseButton onClick={(evt) => onRemove(evt, index)} />
        </Tag>
      )),
    [groups]
  );

  return (
    <Stack spacing="1">
      <FormLabel>{label ? label : t("Target groups")}</FormLabel>
      <Box
        onClick={dialog.open}
        cursor="pointer"
        w="100%"
        border="1px solid"
        borderColor="grey.100"
        borderRadius="xl"
        minHeight="42px"
        h="auto"
        display="flex"
        flexWrap="wrap"
        transition="all .2s ease"
        py="3"
        px="3"
        gap="2"
        _hover={{
          borderColor: "grey.200",
        }}
      >
        {withAny ? (
          <>
            {groups?.length > 0 ? (
              render
            ) : (
              <Tag colorScheme="grey">
                <TagLabel>{t("Any")}</TagLabel>
              </Tag>
            )}
          </>
        ) : (
          <>
            {groups?.length > 0 ? (
              render
            ) : (
              <Text color="grey.400">{t("Select groups")}</Text>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
}
