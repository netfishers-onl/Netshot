import { Protected, SidebarLink } from "@/components";
import { FiPlus } from "react-icons/fi";
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
          label={t("common.all")}
          description={t("task.allStatus")}
        />
        <SidebarLink
          to="./running"
          label={t("common.running")}
          description={t("task.inProgress")}
        />
        <SidebarLink
          to="./scheduled"
          label={t("common.scheduled")}
          description={t("task.scheduledForLater")}
        />
        <SidebarLink
          to="./succeeded"
          label={t("common.succeeded")}
          description={t("task.withSuccessResult")}
        />
        <SidebarLink
          to="./failed"
          label={t("common.failed")}
          description={t("task.withFailedResult")}
        />
        <SidebarLink
          to="./cancelled"
          label={t("common.cancelled")}
          description={t("task.cancelledBySoftwareOrUser")}
        />
      </Stack>
      <Protected minLevel={Level.Operator}>
        <Separator />
        <Stack py="4" px="5">
          <AddTaskButton
            renderItem={(open) => (
              <Button onClick={open}><FiPlus />{t("task.add")}</Button>
            )}
          />
        </Stack>
      </Protected>
    </Stack>
  );
}
