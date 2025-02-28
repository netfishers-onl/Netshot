import {
  Checkbox as NativeCheckbox,
  SystemStyleObject,
} from "@chakra-ui/react";
import { FocusEventHandler, PropsWithChildren } from "react";
import { Control, FieldPath, PathValue, useController } from "react-hook-form";

export type CheckboxProps<T> = {
  control: Control<T>;
  name: FieldPath<T>;
  defaultValue?: any;
  value?: any;
  onFocus?: FocusEventHandler<HTMLElement>;
  onChange?(value: PathValue<T, FieldPath<T>>): void;
  onBlur?: FocusEventHandler<HTMLElement>;
  sx?: SystemStyleObject;
};

export default function Checkbox<T>(
  props: PropsWithChildren<CheckboxProps<T>>
) {
  const { children, name, control, defaultValue, value } = props;
  const { field } = useController({
    name,
    control,
    defaultValue,
  });

  return (
    <NativeCheckbox
      onChange={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      isChecked={field.value as boolean}
      value={value}
    >
      {children}
    </NativeCheckbox>
  );
}
