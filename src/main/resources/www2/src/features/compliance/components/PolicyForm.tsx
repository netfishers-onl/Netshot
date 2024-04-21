import { FormControl, GroupAutocomplete, Icon } from "@/components";
import { Group } from "@/types";
import { Flex, Heading, IconButton, Stack, Text } from "@chakra-ui/react";
import { useCallback } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type Form = {
  name: string;
  targetGroups: Group[];
};

export default function PolicyForm() {
  const { t } = useTranslation();
  const form = useFormContext<Form>();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "targetGroups",
  });

  const addGroup = useCallback(
    (group: Group) => {
      append(group);
    },
    [form, append]
  );

  const filterOption = useCallback(
    (option) => {
      return (
        fields.findIndex((field) => field.name === option.data.name) === -1
      );
    },
    [fields]
  );

  return (
    <Stack spacing="6">
      <FormControl
        label={t("Name")}
        placeholder={t("e.g. My policy")}
        isRequired
        control={form.control}
        name="name"
      />
      <Stack spacing="4">
        <Heading as="h5" size="sm">
          {t("Apply to groups")}
        </Heading>
        <Stack spacing="3">
          <GroupAutocomplete onChange={addGroup} filterOption={filterOption} />
          <Stack spacing="2">
            {fields.map((group, index) => (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                key={index}
                pl="5"
                pr="3"
                border="1px solid"
                borderColor="grey.100"
                bg="white"
                borderRadius="xl"
                h="48px"
              >
                <Text>{group.name}</Text>
                <IconButton
                  aria-label={t("Remove group")}
                  icon={<Icon name="trash" />}
                  colorScheme="green"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                />
              </Stack>
            ))}
          </Stack>
          {fields.length === 0 && (
            <Flex
              bg="grey.50"
              borderRadius="xl"
              py="4"
              justifyContent="center"
              alignContent="center"
            >
              <Text color="grey.500">{t("No group selected")}</Text>
            </Flex>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
