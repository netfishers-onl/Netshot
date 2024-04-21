import { Icon } from "@/components";
import {
  Alert,
  Box,
  Flex,
  HStack,
  IconButton,
  useToast as NativeUserToast,
  Spacer,
  Spinner,
  Stack,
  Text,
  ToastId,
  UseToastOptions,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useMemo } from "react";

function Toast(props: { onClose(): void } & UseToastOptions) {
  const { status, onClose } = props;

  // @ts-ignore
  const isScript = useMemo(() => status === "script", [status]);

  const icon = useMemo(() => {
    let bg: string;

    if (status === "error") {
      bg = "red.50";
    } else if (status === "warning") {
      bg = "yellow.50";
    } else if (status === "success") {
      bg = "green.50";
    }

    return (
      <Flex
        alignItems="center"
        justifyContent="center"
        w="32px"
        h="32px"
        bg={bg}
        borderRadius="full"
      >
        {status === "error" && <Icon name="x" color="red.800" />}
        {status === "success" && <Icon name="check" color="green.800" />}
        {status === "info" && <Icon name="info" color="blue.800" />}
        {status === "warning" && (
          <Icon name="alertTriangle" color="yellow.800" />
        )}
        {status === "loading" && <Spinner />}
      </Flex>
    );
  }, [status]);

  return (
    <Alert
      status="error"
      sx={{
        bg: "white",
        color: "black",
        borderRadius: "2xl",
        display: "flex",
        py: "6",
        pl: "6",
        pr: isScript ? "6" : "16",
        boxShadow: "0 2px 10px 0 rgba(140, 149, 159, .16)",
        minWidth: "410px",
      }}
    >
      {isScript ? (
        <Stack spacing="5">
          <Stack direction="row">
            <Text fontSize="lg" fontWeight="700">
              {props.title}
            </Text>
            <Spacer />
            <IconButton
              position="absolute"
              right="6"
              top="6"
              size="sm"
              onClick={onClose}
              icon={<Icon name="x" />}
              aria-label="Close toast"
            />
          </Stack>

          <Box p="6" borderWidth="1px" borderColor="grey.100" borderRadius="xl">
            <Text color="grey.600" whiteSpace="pre-wrap" fontFamily="mono">
              {props.description}
            </Text>
          </Box>
        </Stack>
      ) : (
        <>
          <HStack spacing="5" alignItems="center">
            {icon}
            <VStack alignItems="start" spacing="0">
              <Text fontSize="lg" fontWeight="700">
                {props.title}
              </Text>

              <Text color="grey.600" whiteSpace="pre-wrap">
                {props.description}
              </Text>
            </VStack>
          </HStack>
          <IconButton
            position="absolute"
            right="10px"
            top="10px"
            size="sm"
            onClick={onClose}
            icon={<Icon name="x" />}
            aria-label="Close toast"
          />
        </>
      )}
    </Alert>
  );
}

export default function useToast() {
  const toast = NativeUserToast({
    position: "bottom-right",
    isClosable: true,
    render: (props) => <Toast {...props} />,
  });

  const isActive = useCallback(
    (id: string) => {
      return toast.isActive(id);
    },
    [toast]
  );

  const error = useCallback(
    (options: Omit<UseToastOptions, "status">) => {
      // Permet de ne pas afficher un toast vide
      if (!options.title && !options.description) return;

      return toast({
        ...options,
        status: "error",
      });
    },
    [toast]
  );

  const success = useCallback(
    (options: Omit<UseToastOptions, "status">) => {
      return toast({
        ...options,
        status: "success",
      });
    },
    [toast]
  );

  const info = useCallback(
    (options: Omit<UseToastOptions, "status">) => {
      return toast({
        ...options,
        status: "info",
      });
    },
    [toast]
  );

  const script = useCallback(
    (options: Omit<UseToastOptions, "status" | "duration" | "isClosable">) => {
      return toast({
        duration: null,
        isClosable: true,
        ...options,
        // @todo: Augment UseToastOptions
        // @ts-ignore
        status: "script",
      });
    },
    [toast]
  );

  const warning = useCallback(
    (options: Omit<UseToastOptions, "status">) => {
      return toast({
        ...options,
        status: "warning",
      });
    },
    [toast]
  );

  const loading = useCallback(
    (options: Omit<UseToastOptions, "status" | "duration">) => {
      return toast({
        duration: null,
        ...options,
        status: "loading",
      });
    },
    [toast]
  );

  const close = useCallback(
    (id: ToastId) => {
      toast.close(id);
    },
    [toast]
  );

  return useMemo(
    () => ({
      error,
      success,
      info,
      warning,
      loading,
      script,
      close,
      isActive,
    }),
    [error, success, info, warning, loading, close, isActive]
  );
}
