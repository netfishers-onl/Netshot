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
          label={t("all")}
          description={t("allTaskStatus")}
        />
        <SidebarLink
          to="./running"
          label={t("running")}
          description={t("tasksInProgress")}
        />
        <SidebarLink
          to="./scheduled"
          label={t("scheduled")}
          description={t("tasksScheduledForLater")}
        />
        <SidebarLink
          to="./succeeded"
          label={t("succeeded")}
          description={t("tasksWithSuccessResult")}
        />
        <SidebarLink
          to="./failed"
          label={t("failed")}
          description={t("tasksWithFailedResult")}
        />
        <SidebarLink
          to="./cancelled"
          label={t("cancelled")}
          description={t("tasksCancelledByUserOrSoftware")}
        />
      </Stack>
      <Protected minLevel={Level.Operator}>
        <Separator />
        <Stack py="4" px="5">
          <AddTaskButton
            renderItem={(open) => (
              <Button onClick={open}><Icon name="plus" />{t("addTask")}</Button>
            )}
          />
        </Stack>
      </Protected>
    </Stack>
  );
}
