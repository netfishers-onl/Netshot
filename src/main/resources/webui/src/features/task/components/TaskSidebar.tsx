import { Icon, Protected, SidebarLink } from "@/components";
import { Level } from "@/types";
import { Steps, Button, Stack, Separator } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import AddTaskButton from "./AddTaskButton";

export default function TaskSidebar() {
  const { t } = useTranslation();

  return (
    <Stack w="300px" overflow="auto" gap="0">
      <Stack gap="0" py="4" px="5" flex="1">
        <SidebarLink
          to="./all"
          label={t("All")}
          description={t("All task status")}
        />
        <SidebarLink
          to="./running"
          label={t("Running")}
          description={t("Tasks in progress")}
        />
        <SidebarLink
          to="./scheduled"
          label={t("Scheduled")}
          description={t("Tasks scheduled for later")}
        />
        <SidebarLink
          to="./succeeded"
          label={t("Succeeded")}
          description={t("Tasks with success result")}
        />
        <SidebarLink
          to="./failed"
          label={t("Failed")}
          description={t("Tasks with failed result")}
        />
        <SidebarLink
          to="./cancelled"
          label={t("Cancelled")}
          description={t("Tasks cancelled by user or software")}
        />
      </Stack>
      <Protected minLevel={Level.Operator}>
        <Separator />
        <Stack py="4" px="5">
          <AddTaskButton
            renderItem={(open) => (
              <Button onClick={open}><Icon name="plus" />{t("Add task")}</Button>
            )}
          />
        </Stack>
      </Protected>
    </Stack>
  );
}
