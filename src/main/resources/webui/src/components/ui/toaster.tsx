import { Icon } from "@/components"
import { DeviceComplianceTag } from "@/features/device/components/DeviceComplianceTag"
import { DeviceComplianceResultType } from "@/types"
import {
  Alert,
  Box,
  createToaster,
  Flex,
  HStack,
  IconButton,
  Portal,
  Spinner,
  Stack,
  SystemStyleObject,
  Text,
  Toast,
  Toaster,
  ToastOptions,
} from "@chakra-ui/react"

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
})

export enum ToastType {
  Success = "success",
  Error = "error",
  Warning = "warning",
  Info = "info",
  Loading = "loading",
  Script = "script",
}

const iconMapping: {
  [K in ToastType]: {
    bg: SystemStyleObject["bg"]
    icon: string
    color: SystemStyleObject["color"]
  }
} = {
  [ToastType.Error]: {
    bg: "red.50",
    icon: "x",
    color: "red.800",
  },
  [ToastType.Success]: {
    bg: "green.50",
    icon: "check",
    color: "green.800",
  },
  [ToastType.Warning]: {
    bg: "yellow.50",
    icon: "alertTriangle",
    color: "yellow.800",
  },
  [ToastType.Info]: {
    bg: "blue.50",
    icon: "info",
    color: "blue.800",
  },
  [ToastType.Loading]: {
    bg: null,
    icon: null,
    color: null,
  },
  [ToastType.Script]: {
    bg: null,
    icon: null,
    color: null,
  },
}

export function ToastProvider() {
  return (
    <Portal>
      <Toaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {({ id, title, description, type, meta }: ToastOptions) => {
          const iconConfig = iconMapping[type as ToastType]

          if (type === ToastType.Script) {
            return (
              <Toast.Root script={true} bg="white">
                <Stack gap="7">
                  <HStack alignItems="center">
                    <Toast.Title color="black" fontSize="lg" fontWeight="semibold">
                      {title}
                    </Toast.Title>
                    <DeviceComplianceTag resultType={meta?.result as DeviceComplianceResultType} />
                  </HStack>
                  <IconButton
                    position="absolute"
                    right="6"
                    top="6"
                    size="sm"
                    onClick={() => toaster.dismiss(id)}
                    aria-label="Close toast"
                  >
                    <Icon name="x" />
                  </IconButton>

                  {description && (
                    <Box p="6" borderWidth="1px" borderColor="gray.100" borderRadius="xl">
                      <Text color="gray.600" whiteSpace="pre-wrap" fontFamily="mono">
                        {description}
                      </Text>
                    </Box>
                  )}
                  {meta?.error && (
                    <Alert.Root bg="grey.50" border="1px solid {colors.grey.100}">
                      <Alert.Description fontSize="md" color="black">
                        {meta?.error}
                      </Alert.Description>
                    </Alert.Root>
                  )}
                </Stack>
              </Toast.Root>
            )
          }

          return (
            <Toast.Root w="md" bg="white">
              <Stack direction="row" alignItems="start" gap="5">
                {type === "loading" ? (
                  <Spinner />
                ) : (
                  <Flex
                    alignItems="center"
                    justifyContent="center"
                    w="32px"
                    flex="0 0 32px"
                    h="32px"
                    bg={iconConfig.bg}
                    borderRadius="full"
                  >
                    <Icon name={iconConfig.icon} color={iconConfig.color} />
                  </Flex>
                )}
                <Stack gap="1">
                  {title && (
                    <Toast.Title color="black" fontSize="lg" fontWeight="semibold">
                      {title}
                    </Toast.Title>
                  )}
                  {description && (
                    <Toast.Description color="black" fontSize="md" lineHeight="moderate">
                      {description}
                    </Toast.Description>
                  )}
                </Stack>
              </Stack>
              <IconButton
                position="absolute"
                right="10px"
                top="10px"
                size="sm"
                onClick={() => toaster.dismiss(id)}
                aria-label="Close toast"
              >
                <Icon name="x" />
              </IconButton>
            </Toast.Root>
          )
        }}
      </Toaster>
    </Portal>
  )
}
