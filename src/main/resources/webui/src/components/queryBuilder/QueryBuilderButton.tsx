import { useFormDialog } from "@/dialog"
import { PropsWithRenderItem } from "@/types"
import { MouseEvent } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { QueryBuilderControl } from "./QueryBuilderControl"
import { QueryBuilderValue } from "./types"

export type QueryBuilderButtonProps = PropsWithRenderItem<{
  value?: QueryBuilderValue
  onSubmit(values: QueryBuilderValue): void
}>

export function QueryBuilderButton(props: QueryBuilderButtonProps) {
  const { renderItem, onSubmit, value = null } = props
  const { t } = useTranslation()
  const dialog = useFormDialog()
  const form = useForm<{
    queryBuilder: QueryBuilderValue
  }>({
    defaultValues: {
      queryBuilder: value,
    },
  })

  return renderItem((evt: MouseEvent<HTMLButtonElement>) => {
    evt?.preventDefault()
    form.setValue("queryBuilder.query", value?.query)

    const dialogRef = dialog.open({
      title: "Query builder",
      description: <QueryBuilderControl control={form.control} name="queryBuilder" />,
      form,
      submitButton: {
        label: t("Search"),
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
  })
}
