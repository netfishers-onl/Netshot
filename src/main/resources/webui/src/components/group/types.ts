export enum FormStep {
  Type,
  Details,
}

export type AddGroupForm = {
  name: string
  folder: string
  visibleInReports: boolean
  staticDevices: number[]
  query: string
}
