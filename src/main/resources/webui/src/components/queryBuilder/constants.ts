export const Attribute = {
  Comments: "comments",
  Contact: "contact",
  CreationDate: "creationDate",
  Domain: "domain",
  Family: "family",
  Id: "id",
  Interface: "interface",
  Ip: "ip",
  LastChangeDate: "lastChangeDate",
  Location: "location",
  Mac: "mac",
  Module: "module",
  Name: "name",
  NetworkClass: "networkClass",
  SoftwareLevel: "softwareLevel",
  SoftwareVersion: "softwareVersion",
  Status: "status",
  Type: "type",
  VirtualName: "virtualName",
  Vrf: "vrf",
} as const

export type AttributeName = keyof typeof Attribute
