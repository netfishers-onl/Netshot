import { transparentize } from "@/theme";
import { Option } from "@/types";
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  SystemStyleObject,
} from "@chakra-ui/react";
import {
  ChakraStylesConfig,
  Select as NativeSelect,
  Props,
} from "chakra-react-select";
import { FocusEventHandler, ReactNode, useMemo } from "react";
import {
  FieldPath,
  PathValue,
  UseControllerProps,
  useController,
} from "react-hook-form";

export type SelectProps<T> = {
  label?: string;
  helperText?: string;
  children?: ReactNode;
  onFocus?: FocusEventHandler<HTMLElement>;
  onChange?(value: Option<PathValue<T, FieldPath<T>>>): void;
  onBlur?: FocusEventHandler<HTMLElement>;
  sx?: SystemStyleObject;
  menuPortalTarget?: HTMLElement;
} & Props &
  UseControllerProps<T>;

function Select<T>(props: SelectProps<T>) {
  const {
    control,
    name,
    value,
    defaultValue,
    label,
    placeholder,
    options = [],
    helperText,
    children,
    onFocus,
    onChange,
    onBlur,
    isRequired,
    isReadOnly,
    isLoading,
    isDisabled,
    sx,
    menuPortalTarget = document.body,
    ...other
  } = props;

  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue,
    rules: {
      required: isRequired,
    },
  });

  const styles = useMemo(() => {
    const outlineColor = transparentize("green.500", 0.16);

    return {
      placeholder: (provided) => ({
        ...provided,
        color: "darkGrey.50",
      }),
      control: (provided) => ({
        ...provided,
        "&[data-focus=true]": {
          borderColor: "green.400",
          outline: "3px solid",
          outlineColor: outlineColor,
        },
      }),
      valueContainer: (provided) => ({
        ...provided,
        px: 3,
      }),
      menuList: (provided) => ({
        ...provided,
        p: 2,
        borderWidth: 1,
        borderColor: "grey.100",
        borderRadius: "xl",
        boxShadow: "0 2px 10px 0 rgba(140, 149, 159, .16)",
        bg: "white",
      }),
      option: (provided, state) => {
        const bg = state.isSelected ? "green.50" : state.isFocused ? "grey.100" : null;
        const color = state.isSelected ? "green.800" : state.isFocused ? "black" : "text";
        return {
          ...provided,
          borderRadius: "lg",
          transition: "all .2s ease",
          bg,
          color,
          "&[data-focus]": {
            bg,
            color,
          }
        };
      },
      clearIndicator: (base) => ({
        ...base,
        border: 0,
      }),
    } as ChakraStylesConfig;
  }, []);

  return (
    <FormControl sx={sx} isRequired={isRequired} isReadOnly={isReadOnly}>
      {label && <FormLabel mb={2}>{label}</FormLabel>}

      <NativeSelect
        styles={{
          menuPortal: (base) => ({
            ...base,
            zIndex: 99999,
          }),
          menu: (base) => ({
            ...base,
            zIndex: "999!important",
          }),
        }}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        chakraStyles={styles}
        value={field.value}
        placeholder={placeholder}
        options={options}
        onChange={(opts: Option<PathValue<T, FieldPath<T>>>) => {
          field.onChange(opts);
          if (onChange) onChange(opts);
        }}
        isLoading={isLoading}
        onBlur={(e) => {
          field.onBlur();
          if (onBlur) onBlur(e);
        }}
        onFocus={onFocus}
        ref={field.ref}
        isReadOnly={isReadOnly}
        isDisabled={isDisabled || isLoading}
        isRequired={isRequired}
        {...other}
      />

      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {error && <FormErrorMessage>{error?.message}</FormErrorMessage>}
    </FormControl>
  );
}

export default Select;
