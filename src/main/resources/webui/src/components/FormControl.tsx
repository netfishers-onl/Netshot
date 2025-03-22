import {
  FormControl as NativeFormControl,
  FormControlProps as NativeFormControlProps,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  type InputProps,
  InputRightElement,
  SystemProps,
  Textarea,
  Tooltip,
} from "@chakra-ui/react";
import {
  forwardRef,
  MutableRefObject,
  ReactElement,
  useCallback,
  useState,
} from "react";
import { useController,UseControllerProps } from "react-hook-form";

import Icon from "./Icon";

export enum FormControlType {
  Text = "text",
  Password = "password",
  LongText = "longtext",
  File = "file",
  Number = "number",
  Date = "date",
  DateTime = "datetime",
  Time = "time",
  Url = "url",
}

export type FormControlProps<T> = {
  label?: string;
  type?: FormControlType;
  helperText?: string;
  uppercase?: boolean;
  rows?: number;
  onFocus?(): void;
  suffix?: ReactElement;
  prefix?: ReactElement;
} & InputProps &
  SystemProps &
  UseControllerProps<T>;

declare module "react" {
  function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactNode | null
  ): (props: P & React.RefAttributes<T>) => React.ReactNode | null;
}

function FormControl<T>(
  props: FormControlProps<T>,
  ref: MutableRefObject<HTMLInputElement | HTMLTextAreaElement>
) {
  const {
    label,
    placeholder,
    control,
    name,
    defaultValue,
    rules = {},
    isRequired,
    isReadOnly,
    type = FormControlType.Text,
    helperText,
    uppercase = false,
    rows = 10,
    onFocus,
    autoFocus,
    suffix,
    prefix,
    ...other
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    rules: {
      required: isRequired,
      ...rules,
    },
    defaultValue,
  });

  let inputProps = {
    onChange(e) {
      field.onChange(uppercase ? e.target.value.toUpperCase() : e);
    },
    onBlur() {
      field.onBlur();
    },
    onFocus() {
      if (onFocus) onFocus();
    },
    placeholder,
    name,
    ref(inputRef) {
      field.ref(inputRef);

      if (ref) {
        ref.current = inputRef;
      }
    },
    autoFocus,
  };

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <NativeFormControl
      isRequired={isRequired}
      isReadOnly={isReadOnly}
      {...(other as NativeFormControlProps)}
    >
      {label && <FormLabel>{label}</FormLabel>}
      {[
        FormControlType.Text,
        FormControlType.Number,
        FormControlType.Date,
        FormControlType.DateTime,
        FormControlType.Time,
        FormControlType.Url,
      ].includes(type) && (
        <InputGroup>
          {prefix && <InputLeftElement>{prefix}</InputLeftElement>}
          <Input
            type={type}
            value={field.value as string}
            autoComplete="off"
            {...inputProps}
          />
          {suffix && <InputRightElement>{suffix}</InputRightElement>}
        </InputGroup>
      )}
      {type === FormControlType.Password && (
        <InputGroup>
          <Input
            type={showPassword ? "text" : "password"}
            value={field.value as string}
            {...inputProps}
          />
          <InputRightElement>
            <Tooltip
              shouldWrapChildren
              placement="top"
              label={showPassword ? "Hide password" : "Show password"}
            >
              <IconButton
                variant="ghost"
                bg="transparent!important"
                aria-label={showPassword ? "Hide password" : "Show password"}
                icon={
                  showPassword ? <Icon name="eye" /> : <Icon name="eyeOff" />
                }
                onClick={togglePassword}
              />
            </Tooltip>
          </InputRightElement>
        </InputGroup>
      )}
      {type === FormControlType.LongText && (
        <Textarea rows={rows} value={field.value as string} {...inputProps} />
      )}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {error && (
        <FormHelperText color="red.500">{error?.message}</FormHelperText>
      )}
    </NativeFormControl>
  );
}

export default forwardRef(FormControl);
