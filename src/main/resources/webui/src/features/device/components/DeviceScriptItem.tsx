import api from "@/api"
import { Icon } from "@/components"
import { Tooltip } from "@/components/ui/tooltip"
import { MUTATIONS, QUERIES } from "@/constants"
import { useConfirmDialogWithMutation } from "@/dialog"
import { useToast } from "@/hooks"
import { Script } from "@/types"
import { IconButton, Stack, StackProps, Tag, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MouseEvent } from "react"
import { Trans, useTranslation } from "react-i18next"

export type DeviceScriptItemProps = {
  isSelected?: boolean
  script: Script
} & StackProps

export default function DeviceScriptItem(props: DeviceScriptItemProps) {
  const { isSelected, script, ...other } = props

  const toast = useToast()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const dialog = useConfirmDialogWithMutation()

  const { mutateAsync, isPending: isLoading } = useMutation({
    mutationKey: MUTATIONS.SCRIPT_REMOVE,
    mutationFn: api.script.remove,
    onError() {
      toast.error({
        title: t("Error"),
        description: t("An error occurred during remove"),
      })
    },
  })

  const open = (evt: MouseEvent<HTMLButtonElement>) => {
    evt?.stopPropagation()
    const dialogRef = dialog.open(MUTATIONS.SCRIPT_REMOVE, {
      title: t("Remove device script"),
      description: (
        <Text>
          <Trans
            t={t}
            i18nKey="You are about to remove the script <bold>{{name}}</bold>?"
            values={{ name: script.name }}
            components={{ bold: <Text as="span" fontWeight="semibold" /> }}
          />
        </Text>
      ),
      isLoading,
      async onConfirm() {
        await mutateAsync(script?.id)
        toast.success({
          title: t("Success"),
          description: t("Device script was successfully removed"),
        })

        dialogRef.close()

        queryClient.invalidateQueries({ queryKey: [QUERIES.SCRIPT_LIST] })
      },
      confirmButton: {
        label: t("Remove"),
        props: {
          colorPalette: "red",
        },
      },
    })
  }

  return (
    <Stack
      position="relative"
      gap="2"
      p="4"
      borderColor={isSelected ? "green.500" : "grey.100"}
      borderWidth="1px"
      borderRadius="2xl"
      bg="white"
      cursor="pointer"
      transition="all .2s ease"
      _hover={{
        "& .chakra-button": {
          opacity: 1,
        },
      }}
      {...other}
    >
      <Text fontWeight="semibold">{script?.name}</Text>
      <Stack direction="row" gap="4">
        <Tag.Root colorPalette="grey">{script?.deviceDriver}</Tag.Root>
        <Tag.Root colorPalette="green">{script?.author}</Tag.Root>
      </Stack>
      <Tooltip content={t("Remove script")}>
        <IconButton
          position="absolute"
          top="4"
          right="4"
          opacity="0"
          transition="all .2s ease"
          size="sm"
          aria-label={t("Remove device script")}
          onClick={open}
          variant="ghost"
          colorPalette="green"
        >
          <Icon name="trash" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
