import { useCallback } from "react";
import { UseControllerProps, useController } from "react-hook-form";
import MonacoEditor, { MonacoEditorProps } from "./MonacoEditor";

export type MonacoEditorControlProps<T> = {
  isRequired?: boolean;
} & MonacoEditorProps &
  UseControllerProps<T>;

export default function MonacoEditorControl<T>(
  props: MonacoEditorControlProps<T>
) {
  const {
    name,
    defaultValue,
    rules,
    control,
    isRequired = false,
    ...other
  } = props;

  const { field } = useController({
    name,
    defaultValue,
    rules: {
      required: isRequired,
      ...rules,
    },
    control,
  });

  const handleChange = useCallback(
    (value: string) => {
      field.onChange(value);
    },
    [field]
  );

  return (
    <MonacoEditor
      value={field.value as string}
      onModelChange={handleChange}
      onBlur={field.onBlur}
      {...other}
    />
  );
}
