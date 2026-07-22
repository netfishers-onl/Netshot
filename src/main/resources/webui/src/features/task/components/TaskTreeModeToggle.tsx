import { Stack, Switch, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useTaskTreeModeStore } from "../stores/useTaskTreeModeStore"

export default function TaskTreeModeToggle() {
  const { t } = useTranslation()
  const treeMode = useTaskTreeModeStore((state) => state.treeMode)
  const setTreeMode = useTaskTreeModeStore((state) => state.setTreeMode)

  return (
    <Stack direction="row" alignItems="center" gap="2" flexShrink={0}>
      <Text>{t("task.treeMode")}</Text>
      <Switch.Root checked={treeMode} size="md" onCheckedChange={(evt) => setTreeMode(evt.checked)}>
        <Switch.HiddenInput />
        <Switch.Control />
      </Switch.Root>
    </Stack>
  )
}
