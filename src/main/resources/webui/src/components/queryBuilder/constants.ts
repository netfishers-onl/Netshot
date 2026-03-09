export const Attribute = {
  Comments: "Comments",
  Contact: "Contact",
  CreationDate: "Creation date",
  Domain: "Domain",
  Family: "Family",
  Id: "ID",
  Interface: "Interface",
  Ip: "IP",
  LastChangeDate: "Last change date",
  Location: "Location",
  Mac: "MAC",
  Module: "Module",
  Name: "Name",
  NetworkClass: "Network class",
  SoftwareLevel: "Software level",
  SoftwareVersion: "Software version",
  Status: "Status",
  Type: "Type",
  VirtualName: "Virtual name",
  Vrf: "VRF",
} as const

export type AttributeName = keyof typeof Attribute
