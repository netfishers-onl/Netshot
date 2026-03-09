import { useDomains } from "@/features/administration/api/queries"
import { usePolicies } from "@/features/compliance/api"
import { useDiagnostics } from "@/features/diagnostic/api"
import { useDeviceTypeOptions } from "@/hooks"
import {
  DeviceComplianceResultType,
  DeviceNetworkClass,
  DeviceSoftwareLevel,
  DeviceStatus,
  DeviceType,
} from "@/types"
import { sortAlphabetical } from "@/utils"
import { useTranslation } from "react-i18next"
import { Attribute, AttributeName } from "./constants"
import { AttributeOption, AttributeType } from "./types"

export function useQueryBuilderAttribute() {
  const { t } = useTranslation()
  const deviceTypeOptions = useDeviceTypeOptions()
  const domainQuery = useDomains()
  const diagnosticQuery = useDiagnostics()
  const policyQuery = usePolicies()

  function getAllGenericOption(): AttributeOption[] {
    const domaineChoices = Array.isArray(domainQuery.data)
      ? domainQuery.data.map((domain) => ({
          label: domain?.name,
          value: domain?.id,
        }))
      : []

    const options = [
      {
        label: t("Comments"),
        value: {
          name: Attribute.Comments,
          type: AttributeType.Text,
        },
      },
      {
        label: t("Contact"),
        value: {
          name: Attribute.Contact,
          type: AttributeType.Text,
        },
      },
      {
        label: t("Creation date"),
        value: {
          name: Attribute.CreationDate,
          type: AttributeType.Date,
        },
      },
      {
        label: t("Domain"),
        value: {
          name: Attribute.Domain,
          type: AttributeType.Enum,
          choices: domaineChoices,
        },
      },
      {
        label: t("Family"),
        value: {
          name: Attribute.Family,
          type: AttributeType.Text,
        },
      },
      {
        label: t("ID"),
        value: {
          name: Attribute.Id,
          type: AttributeType.Id,
        },
      },
      {
        label: t("Interface"),
        value: {
          name: Attribute.Interface,
          type: AttributeType.Text,
        },
      },
      {
        label: t("IP"),
        value: {
          name: Attribute.Ip,
          type: AttributeType.IpAddress,
        },
      },
      {
        label: t("Last change date"),
        value: {
          name: Attribute.LastChangeDate,
          type: AttributeType.Date,
        },
      },
      {
        label: t("Location"),
        value: {
          name: Attribute.Location,
          type: AttributeType.Text,
        },
      },
      {
        label: t("MAC"),
        value: {
          name: Attribute.Mac,
          type: AttributeType.MacAddress,
        },
      },
      {
        label: t("Module"),
        value: {
          name: Attribute.Module,
          type: AttributeType.Text,
        },
      },
      {
        label: t("Name"),
        value: {
          name: Attribute.Name,
          type: AttributeType.Text,
        },
      },
      {
        label: t("Network class"),
        value: {
          name: Attribute.NetworkClass,
          type: AttributeType.Enum,
          choices: [
            { label: t("Firewall"), value: DeviceNetworkClass.Firewall },
            {
              label: t("Load balancer"),
              value: DeviceNetworkClass.LoadBalancer,
            },
            { label: t("Router"), value: DeviceNetworkClass.Router },
            { label: t("Server"), value: DeviceNetworkClass.Server },
            { label: t("Switch"), value: DeviceNetworkClass.Switch },
            {
              label: t("Switch router"),
              value: DeviceNetworkClass.SwitchRouter,
            },
            { label: t("Access point"), value: DeviceNetworkClass.AccessPoint },
            {
              label: t("Wireless controller"),
              value: DeviceNetworkClass.WirelessController,
            },
            {
              label: t("Console server"),
              value: DeviceNetworkClass.ConsoleServer,
            },
            { label: t("Unknown"), value: DeviceNetworkClass.Unknown },
          ],
        },
      },
      {
        label: t("Software Level"),
        value: {
          name: Attribute.SoftwareLevel,
          type: AttributeType.Enum,
          choices: [
            { label: t("Gold"), value: DeviceSoftwareLevel.GOLD },
            { label: t("Silver"), value: DeviceSoftwareLevel.SILVER },
            { label: t("Bronze"), value: DeviceSoftwareLevel.BRONZE },
            { label: t("Unknown"), value: DeviceSoftwareLevel.UNKNOWN },
          ],
        },
      },
      {
        label: t("Software version"),
        value: {
          name: Attribute.SoftwareVersion,
          type: AttributeType.Text,
        },
      },
      {
        label: t("Status"),
        value: {
          name: Attribute.Status,
          type: AttributeType.Enum,
          choices: [
            { label: t("Production"), value: DeviceStatus.Production },
            { label: t("Disabled"), value: DeviceStatus.Disabled },
            { label: t("PreProduction"), value: DeviceStatus.PreProduction },
          ],
        },
      },
      {
        label: t("Type"),
        value: {
          name: Attribute.Type,
          type: AttributeType.Enum,
          choices: deviceTypeOptions.getOptionsWithName(),
        },
      },
      {
        label: t("Virtual name"),
        value: {
          name: Attribute.VirtualName,
          type: AttributeType.Text,
        },
      },
      {
        label: t("VRF"),
        value: {
          name: Attribute.Vrf,
          type: AttributeType.Text,
        },
      },
    ]

    return sortAlphabetical(options, "label")
  }

  function getAllTypeSpecificOption(driver: DeviceType["name"]) {
    const deviceType = deviceTypeOptions.getOptionByDriver(driver)

    if (!deviceType) {
      return []
    }

    const attributes = deviceType.value.attributes

    if (!Array.isArray(attributes)) {
      return []
    }

    const options = attributes.map((attr) => ({
      label: t(attr.title),
      value: {
        name: attr.name,
        type: attr.type,
      },
    }))

    return sortAlphabetical(options, "label")
  }

  function getAllDiagnosticResultOption() {
    if (!Array.isArray(diagnosticQuery.data)) {
      return []
    }

    return diagnosticQuery.data.map((diagnostic) => ({
      label: `${diagnostic?.name}`,
      value: {
        name: `Diagnostic > ${diagnostic?.name}`,
        type: diagnostic?.resultType,
      },
    }))
  }

  function getAllComplianceRuleResultOption(policyId: number) {
    if (!policyId) {
      return []
    }

    const policy = policyQuery.data.find((p) => p.id === policyId)

    if (!policy) {
      return []
    }

    const options = policy.rules.map((r) => ({
      label: r.name,
      value: {
        name: `Rule > ${policy.name} > ${r.name}`,
        type: AttributeType.Enum,
        choices: [
          {
            label: t("Confirming"),
            value: DeviceComplianceResultType.Conforming,
          },
          {
            label: t("Non confirming"),
            value: DeviceComplianceResultType.NonConfirming,
          },
          {
            label: t("Not applicable"),
            value: DeviceComplianceResultType.NotApplication,
          },
          { label: t("Exempted"), value: DeviceComplianceResultType.Exempted },
          { label: t("Disabled"), value: DeviceComplianceResultType.Disabled },
          {
            label: t("Invalid rule"),
            value: DeviceComplianceResultType.InvalidRule,
          },
        ],
      },
    }))

    return sortAlphabetical(options, "label")
  }

  function getAttributeByName(name: AttributeName, attributes: AttributeOption[]) {
    if (attributes?.length === 0) {
      return null
    }

    return attributes.find((attribute) => attribute.value?.name === name)?.value
  }

  const isLoading =
    domainQuery.isPending &&
    deviceTypeOptions.isPending &&
    diagnosticQuery.isPending &&
    policyQuery.isPending

  return {
    getAllGenericOption,
    getAllTypeSpecificOption,
    getAllDiagnosticResultOption,
    getAllComplianceRuleResultOption,
    getAttributeByName,
    isLoading,
  }
}
