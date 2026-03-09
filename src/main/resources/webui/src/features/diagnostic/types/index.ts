import { DeviceType, DiagnosticResultType } from "@/types"

export type Form = {
  name: string
  resultType: DiagnosticResultType
  targetGroup: number
  deviceDriver: DeviceType["name"]
  cliMode: string
  command: string
  modifierPattern: string
  modifierReplacement: string
  script: string
}
