import { transparentize } from "@/theme";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  SystemStyleObject,
} from "@chakra-ui/react";
import {
  AsyncSelect,
  ChakraStylesConfig,
  Props,
  chakraComponents,
} from "chakra-react-select";
import { FocusEventHandler, ReactNode, useMemo } from "react";
import Icon from "./Icon";

export type AutocompleteProps<T> = {
  label?: string;
  helperText?: string;
  children?: ReactNode;
  onFocus?: FocusEventHandler<HTMLElement>;
  onChange?(value: T): void;
  onBlur?: FocusEventHandler<HTMLElement>;
  loadOptions(value: string): Promise<T[]>;
  defaultOptions?: boolean;
  sx?: SystemStyleObject;
} & Props;

function Select<T>(props: AutocompleteProps<T>) {
  const {
    label,
    placeholder,
    helperText,
    children,
    onFocus,
    onChange,
    onBlur,
    loadOptions,
    defaultOptions = false,
    sx,
    ...other
  } = props;

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
        px: 4,
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
      downChevron: (provided) => ({
        ...provided,
        mr: 4,
      }),
      option: (provided, state) => ({
        ...provided,
        borderRadius: "lg",
        color: state.isSelected ? "green.800" : "text",
        bg: state.isSelected ? "green.50" : null,
        transition: "all .2s ease",
        "&:hover": {
          bg: state.isSelected ? "green.50" : "grey.100",
          color: state.isSelected ? "green.800" : "black",
        },
      }),
    } as ChakraStylesConfig;
  }, []);

  return (
    <FormControl sx={sx}>
      {label && <FormLabel mb={2}>{label}</FormLabel>}

      <AsyncSelect
        useBasicStyles
        styles={{
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menu: (base) => ({
            ...base,
            zIndex: "999!important",
          }),
        }}
        components={{
          DropdownIndicator: (props) => (
            <chakraComponents.DropdownIndicator {...props}>
              <Icon name="search" />
            </chakraComponents.DropdownIndicator>
          ),
        }}
        chakraStyles={styles}
        menuPortalTarget={document.querySelector("body")}
        placeholder={placeholder}
        onChange={(data: T) => {
          if (onChange) onChange(data);
        }}
        onFocus={onFocus}
        cacheOptions
        loadOptions={loadOptions}
        defaultOptions={defaultOptions}
        {...other}
      />

      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

export default Select;
