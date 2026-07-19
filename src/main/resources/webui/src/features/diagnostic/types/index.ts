import { DeviceType, DiagnosticResultType } from "@/types"

export type Form = {
  name: string
  enabled: boolean
  resultType: DiagnosticResultType | null
  targetGroup: number | null
  deviceDriver: DeviceType["name"] | null
  cliMode: string | null
  command: string
  modifierPattern: string
  modifierReplacement: string
  script: string
}
