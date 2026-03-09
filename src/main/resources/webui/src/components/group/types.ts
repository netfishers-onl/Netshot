import { DeviceType } from "@/types"

export enum FormStep {
  Type,
  Details,
}

export type AddGroupForm = {
  name: string
  folder: string
  visibleInReports: boolean
  staticDevices: number[]
  driver: DeviceType["name"]
  query: string
}
