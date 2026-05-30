import { DeviceType, DiagnosticResultType } from "@/types"

export type Form = {
  name: string
  enabled: boolean
  resultType: DiagnosticResultType
  targetGroup: number
  deviceDriver: DeviceType["name"]
  cliMode: string
  command: string
  modifierPattern: string
  modifierReplacement: string
  script: string
}
