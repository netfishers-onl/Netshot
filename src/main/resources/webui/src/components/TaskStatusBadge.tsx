import { Badge, BadgeProps, Icon } from "@chakra-ui/react"
import { forwardRef } from "react"
import {
  LuBan,
  LuCircleDashed,
  LuCircleDot,
  LuCirclePlay,
  LuClock,
  LuCircleCheck,
  LuCircleX,
} from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { TaskStatus } from "@/types"

type Config = {
  colorPalette: string
  icon: React.ReactElement
  labelKey: string
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, Config> = {
  [TaskStatus.New]: {
    colorPalette: "gray",
    icon: <LuCircleDot />,
    labelKey: "common.new",
  },
  [TaskStatus.Scheduled]: {
    colorPalette: "yellow",
    icon: <LuClock />,
    labelKey: "common.scheduled",
  },
  [TaskStatus.Waiting]: {
    colorPalette: "gray",
    icon: <LuCircleDashed />,
    labelKey: "common.waiting",
  },
  [TaskStatus.Running]: {
    colorPalette: "blue",
    icon: <LuCirclePlay />,
    labelKey: "common.running",
  },
  [TaskStatus.Success]: {
    colorPalette: "green",
    icon: <LuCircleCheck />,
    labelKey: "common.success",
  },
  [TaskStatus.Failure]: {
    colorPalette: "red",
    icon: <LuCircleX />,
    labelKey: "common.failure",
  },
  [TaskStatus.Cancelled]: {
    colorPalette: "gray",
    icon: <LuBan />,
    labelKey: "common.cancelled",
  },
}

type TaskStatusBadgeProps = BadgeProps & {
  status: TaskStatus
}

const TaskStatusBadge = forwardRef<HTMLSpanElement, TaskStatusBadgeProps>(
  ({ status, ...rest }, ref) => {
    const { t } = useTranslation()
    const config = TASK_STATUS_CONFIG[status]

    if (!config) return null

    return (
      <Badge
        ref={ref}
        variant="surface"
        colorPalette={config.colorPalette}
        size="md"
        display="inline-flex"
        alignItems="center"
        gap="1"
        {...rest}
      >
        <Icon size="sm" flexShrink={0}>{config.icon}</Icon>
        {t(config.labelKey)}
      </Badge>
    )
  }
)

export default TaskStatusBadge
