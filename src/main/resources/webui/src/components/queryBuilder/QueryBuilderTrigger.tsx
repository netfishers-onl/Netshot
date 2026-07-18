import React, { MouseEvent } from "react"
import Slot from "@/components/Slot"
import { useFormDialog } from "@/dialog"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QueryBuilderDialog } from "./QueryBuilderDialog"
import { QueryBuilderValue } from "./types"

export type QueryBuilderTriggerProps = {
  value?: QueryBuilderValue
  onSubmit(values: QueryBuilderValue): void
  children: React.ReactElement<Record<string, unknown>>
} & Record<string, unknown>

export function QueryBuilderTrigger({ onSubmit, value = null, children, ...rest }: QueryBuilderTriggerProps) {
  const { t } = useTranslation()
  const dialog = useFormDialog()
  const form = useForm<{
    queryBuilder: QueryBuilderValue
  }>({
    defaultValues: {
      queryBuilder: value,
    },
  })

  const open = (evt: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    form.setValue("queryBuilder.query", value?.query)

    const dialogRef = dialog.open({
      title: t("common.queryBuilder"),
      description: <QueryBuilderDialog control={form.control} name="queryBuilder" />,
      form,
      submitButton: {
        label: t("common.search"),
      },
      onSubmit(values) {
        dialogRef.close()

        onSubmit({
          driver: values.queryBuilder.driver,
          query: values.queryBuilder.query,
        })
      },
      size: "xl",
    })
  }

  return <Slot onTrigger={open} {...rest}>{children}</Slot>
}
