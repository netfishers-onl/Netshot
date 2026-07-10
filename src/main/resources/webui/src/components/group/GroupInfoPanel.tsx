import { FormControl, Switch } from "@/components"
import { GroupType } from "@/types"
import { Heading, Separator, Spacer, Stack } from "@chakra-ui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import PreviewDynamicGroupButton from "./PreviewDynamicGroupButton"
import { GroupForm } from "./types"

export type GroupInfoPanelProps = {
  groupType: GroupType
}

export default function GroupInfoPanel(props: GroupInfoPanelProps) {
  const { groupType } = props
  const { t } = useTranslation()
  const form = useFormContext<GroupForm>()

  const query = useWatch({
    control: form.control,
    name: "query",
  })

  return (
    <Stack gap="5" w="340px" h="full" overflowY="auto">
      <Heading as="h4" size="md">
        {t("common.information")}
      </Heading>
      <FormControl
        required
        control={form.control}
        name="name"
        label={t("common.name")}
        placeholder={t("group.enterName")}
      />
      <FormControl
        control={form.control}
        name="folder"
        label={t("common.folder")}
        placeholder={t("common.eG", { example: t("group.folderExample") })}
        helperText={t("group.useSlashesForFolder")}
      />
      <Separator />
      <Switch
        label={t("report.list")}
        description={t("group.showInReports")}
        control={form.control}
        name="visibleInReports"
      />
      <Spacer />
      {groupType === GroupType.Dynamic && (
        <PreviewDynamicGroupButton query={query ?? ""} />
      )}
    </Stack>
  )
}
