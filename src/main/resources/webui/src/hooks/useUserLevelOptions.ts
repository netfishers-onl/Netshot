import { Level } from "@/types"
import { createOptionHook } from "./createOptionHook"

export const useUserLevelOptions = createOptionHook([
  {
    label: "admin",
    description: "adminLevelDescription",
    value: Level.Admin,
  },
  {
    label: "readWritePlusExecuteScripts",
    description: "readWritePlusExecuteScriptsLevelDescription",
    value: Level.ExecureReadWrite,
  },
  {
    label: "readWrite",
    description: "readWriteLevelDescription",
    value: Level.ReadWrite,
  },
  {
    label: "operator",
    description: "operatorLevelDescription",
    value: Level.Operator,
  },
  {
    label: "visitor",
    description: "visitorLevelDescription",
    value: Level.Visitor,
  },
])
