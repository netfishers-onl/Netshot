import api from "@/api"
import { QUERIES } from "@/constants"
import { useFormDialog } from "@/dialog"
import { Group } from "@/types"
import { createFoldersFromGroups, Folder } from "@/utils"
import { Box, Field, Stack, Tag, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { MouseEvent, useCallback, useMemo } from "react"
import { useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { TreeGroup } from "./group"

type SelectGroupForm = {
  groups: Array<{ id: number }>
  isMulti: boolean
}

function SelectGroupDialog({ items }: { items: (Group | Folder)[] }) {
  const form = useFormContext<SelectGroupForm>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups",
    keyName: "fieldId",
  })

  const isMulti = useWatch({
    control: form.control,
    name: "isMulti",
  })

  const isSelected = useCallback(
    (group: Group) => {
      return fields.some((field) => field.id === group.id)
    },
    [fields]
  )

  const onGroupSelect = useCallback(
    (group: Group) => {
      if (!isMulti) {
        form.setValue("groups", [{ id: group.id }])
        return
      }

      if (isSelected(group)) {
        remove(fields.findIndex((field) => field.id === group.id))
      } else {
        append(group)
      }
    },
    [append, remove, fields, isSelected, isMulti]
  )

  return (
    <Stack pl="2">
      <TreeGroup items={items} onGroupSelect={onGroupSelect} isSelected={isSelected} />
    </Stack>
  )
}

export type TreeGroupSelectorProps = {
  label?: string
  value?: number[]
  onChange(groups: number[]): void
  isMulti?: boolean
  withAny?: boolean
  required?: boolean
  readOnly?: boolean
  disabled?: boolean
}

export default function TreeGroupSelector(props: TreeGroupSelectorProps) {
  const {
    value = [],
    onChange,
    label,
    isMulti = false,
    withAny = false,
    required = false,
    readOnly = false,
    disabled = false,
  } = props

  const { t } = useTranslation()
  const dialog = useFormDialog()

  const form = useForm<SelectGroupForm>({
    defaultValues: {
      groups: value.map((v) => ({ id: v })),
      isMulti,
    },
  })

  const { data: groups, isLoading } = useQuery({
    queryKey: [QUERIES.DEVICE_GROUPS],
    queryFn: async () => api.group.getAll(),
  })

  const items = useMemo(() => createFoldersFromGroups(groups), [groups])

  const { remove } = useFieldArray({
    control: form.control,
    name: "groups",
    keyName: "fieldId",
  })

  const groupField = useWatch({
    control: form.control,
    name: "groups",
  })

  const onRemove = useCallback(
    (evt: MouseEvent<HTMLButtonElement>, index: number) => {
      evt?.stopPropagation()

      remove(index)

      if (onChange) {
        const values = form.getValues()
        onChange(values.groups.map((g) => g.id))
      }
    },
    [remove, onChange, form]
  )

  const selectedGroups = useMemo(() => {
    if (withAny && groupField.length === 0) {
      return [t("anyLabel")]
    }

    if (items?.length === 0) {
      return []
    }

    return groupField
      .map((field) => {
        return groups.find((group) => group.id === field.id)?.name
      })
      .filter(Boolean)
  }, [groups, groupField, items, withAny])

  const open = () => {
    const dialogRef = dialog.open({
      title: t("selectGroups"),
      description: <SelectGroupDialog items={items} />,
      form,
      onSubmit() {
        const values = form.getValues()

        if (onChange) {
          onChange(values.groups.map((g) => g.id))
        }

        dialogRef.close()
      },
      size: "lg",
    })
  }

  const isDisabled = disabled || isLoading

  /* return (
    <Field.Root required={required} readOnly={readOnly} disabled={isDisabled} onClick={open}>
      <TagsInput.Root max={1}>
        <TagsInput.Label>{label ? label : t("targetGroups")}</TagsInput.Label>
        <TagsInput.Control>
          {selectedGroups.map((tag, index) => (
            <TagsInput.Item key={index} index={index} value={tag}>
              <TagsInput.ItemPreview>
                <TagsInput.ItemText>{tag}</TagsInput.ItemText>
                <TagsInput.ItemDeleteTrigger onClick={(evt) => onRemove(evt, index)} />
              </TagsInput.ItemPreview>
              <TagsInput.ItemInput />
            </TagsInput.Item>
          ))}

          <TagsInput.Input placeholder={t("selectGroups")} />
        </TagsInput.Control>
      </TagsInput.Root>
    </Field.Root>
  ) */

  const render = useMemo(() => {
    return selectedGroups.map((group, index) => (
      <Tag.Root key={index} size="lg">
        <Tag.Label>{group}</Tag.Label>
        <Tag.EndElement>
          <Tag.CloseTrigger type="button" onClick={(evt) => onRemove(evt, index)} />
        </Tag.EndElement>
      </Tag.Root>
    ))
  }, [selectedGroups])

  return (
    <Stack gap="1">
      <Field.Root required={required} readOnly={readOnly} disabled={isDisabled}>
        <Field.Label>
          {label ? label : t("targetGroups")}
          <Field.RequiredIndicator />
        </Field.Label>
        <Box
          onClick={open}
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
              {groupField?.length > 0 ? (
                render
              ) : (
                <Tag.Root colorPalette="grey" size="md">
                  <Tag.Label>{t("anyLabel")}</Tag.Label>
                </Tag.Root>
              )}
            </>
          ) : (
            <>
              {groupField?.length > 0 ? render : <Text color="grey.400">{t("selectGroups")}</Text>}
            </>
          )}
        </Box>
      </Field.Root>
    </Stack>
  )
}
