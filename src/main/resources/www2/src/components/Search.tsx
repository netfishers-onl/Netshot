import {
  Box,
  BoxProps,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/react";
import {
  ChangeEvent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search as SearchIcon, X } from "react-feather";

/**
 * @todo: Add useThrottle
 */
export type SearchProps = PropsWithChildren<
  {
    clear?: boolean;
    onQuery(query: string): void;
    onClear?(): void;
    placeholder: string;
    isDisabled?: boolean;
  } & BoxProps
>;

export default function Search(props: SearchProps) {
  const {
    clear = false,
    onQuery,
    onClear,
    placeholder,
    children,
    isDisabled = false,
    ...other
  } = props;
  const [innerValue, setInnerValue] = useState<string>("");
  const ref = useRef<HTMLInputElement>();

  const clearValue = useCallback(() => {
    setInnerValue("");
    ref.current.focus();

    setTimeout(() => {
      if (onClear) onClear();
    });
  }, [onQuery, ref]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setInnerValue(e.target.value);

      setTimeout(() => {
        if (onQuery) onQuery(e.target.value);
      });
    },
    [onQuery]
  );

  const hasClear = useMemo(
    () => innerValue?.length > 0 || clear,
    [innerValue, clear]
  );

  return (
    <Box {...other}>
      <InputGroup>
        <InputLeftElement>
          <SearchIcon size={18} />
        </InputLeftElement>
        <Input
          variant="outline"
          ref={ref}
          value={innerValue}
          isDisabled={isDisabled}
          onChange={handleChange}
          placeholder={placeholder}
        />

        <InputRightElement width="auto">
          {children}
          {hasClear && (
            <IconButton
              variant="ghost"
              colorScheme="gray"
              aria-label="Clear"
              icon={<X />}
              onClick={clearValue}
            />
          )}
        </InputRightElement>
      </InputGroup>
    </Box>
  );
}
