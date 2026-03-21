import { Level } from "@/types"
import { createOptionHook } from "./createOptionHook"

export const useUserLevelOptions = createOptionHook([
  {
    label: "admin",
    value: Level.Admin,
  },
  {
    label: "readWritePlusExecuteScripts",
    value: Level.ExecureReadWrite,
  },
  {
    label: "readWrite",
    value: Level.ReadWrite,
  },
  {
    label: "operator",
    value: Level.Operator,
  },
  {
    label: "visitor",
    value: Level.Visitor,
  },
])
