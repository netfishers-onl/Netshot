import { Level } from "@/types"
import { createOptionHook } from "./createOptionHook"

export const useUserLevelOptions = createOptionHook([
  {
    label: "Admin",
    value: Level.Admin,
  },
  {
    label: "Read-write, plus execute scripts",
    value: Level.ExecureReadWrite,
  },
  {
    label: "Read-write",
    value: Level.ReadWrite,
  },
  {
    label: "Operator",
    value: Level.Operator,
  },
  {
    label: "Visitor",
    value: Level.Visitor,
  },
])
