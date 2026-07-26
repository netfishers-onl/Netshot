import { SimpleDevice } from "@/types"

export enum FormStep {
  Type,
  Details,
}

export type GroupForm = {
  name: string
  folder: string
  visibleInReports: boolean
  staticDevices: SimpleDevice[]
  query: string
}
