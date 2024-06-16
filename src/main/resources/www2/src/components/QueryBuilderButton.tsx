import { Dialog } from "@/dialog";
import { MouseEvent, ReactElement, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import QueryBuilderControl, { QueryBuilderValue } from "./QueryBuilderControl";

export type QueryBuilderButtonProps = {
  value?: QueryBuilderValue;
  renderItem(open: (evt: MouseEvent<HTMLButtonElement>) => void): ReactElement;
  onSubmit(values: QueryBuilderValue): void;
};

export default function QueryBuilderButton(props: QueryBuilderButtonProps) {
  const { renderItem, onSubmit, value = null } = props;
  const { t } = useTranslation();
  const form = useForm<{
    queryBuilder: QueryBuilderValue;
  }>({
    defaultValues: {
      queryBuilder: value,
    },
  });

  const dialog = Dialog.useForm({
    title: t("Query builder"),
    description: (
      <QueryBuilderControl control={form.control} name="queryBuilder" />
    ),
    form,
    onSubmit(values) {
      dialog.close();

      onSubmit({
        driver: values.queryBuilder.driver,
        query: values.queryBuilder.query,
      });
    },
    size: "6xl",
  });

  const open = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault();
      form.setValue("queryBuilder.query", value?.query);
      dialog.updateProps({
        form,
      });
      dialog.open();
    },
    [dialog, value, form]
  );

  return renderItem(open);
}
