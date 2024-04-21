import {
  Switch as ChakraSwitch,
  FormControl,
  FormControlProps,
  FormLabel,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChangeEvent, useCallback } from "react";
import { Control, FieldPath, useController } from "react-hook-form";

export type SwitchProps<T> = {
  control: Control<T>;
  name: FieldPath<T>;
  defaultValue?: any;
  label?: string;
  description?: string;
} & FormControlProps;

export default function Switch<T>(props: SwitchProps<T>) {
  const { label, description, control, name, defaultValue, ...other } = props;

  const { field } = useController({
    name,
    control,
    defaultValue,
  });

  const onChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    field.onChange(evt?.target.checked);
  }, []);

  return (
    <FormControl
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      {...other}
    >
      <Stack spacing="0">
        <FormLabel mb="0">{label}</FormLabel>

        <Text color="grey.400">{description}</Text>
      </Stack>
      <ChakraSwitch
        size="md"
        isChecked={field.value as boolean}
        onChange={onChange}
      />
    </FormControl>
  );
}
