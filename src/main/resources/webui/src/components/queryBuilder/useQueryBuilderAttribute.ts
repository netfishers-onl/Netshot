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
        label: t("comments"),
        value: {
          name: Attribute.Comments,
          type: AttributeType.Text,
        },
      },
      {
        label: t("contact"),
        value: {
          name: Attribute.Contact,
          type: AttributeType.Text,
        },
      },
      {
        label: t("creationDate"),
        value: {
          name: Attribute.CreationDate,
          type: AttributeType.Date,
        },
      },
      {
        label: t("domain"),
        value: {
          name: Attribute.Domain,
          type: AttributeType.Enum,
          choices: domaineChoices,
        },
      },
      {
        label: t("family"),
        value: {
          name: Attribute.Family,
          type: AttributeType.Text,
        },
      },
      {
        label: t("id"),
        value: {
          name: Attribute.Id,
          type: AttributeType.Id,
        },
      },
      {
        label: t("interface"),
        value: {
          name: Attribute.Interface,
          type: AttributeType.Text,
        },
      },
      {
        label: t("ip"),
        value: {
          name: Attribute.Ip,
          type: AttributeType.IpAddress,
        },
      },
      {
        label: t("lastChangeDate"),
        value: {
          name: Attribute.LastChangeDate,
          type: AttributeType.Date,
        },
      },
      {
        label: t("location"),
        value: {
          name: Attribute.Location,
          type: AttributeType.Text,
        },
      },
      {
        label: t("mac"),
        value: {
          name: Attribute.Mac,
          type: AttributeType.MacAddress,
        },
      },
      {
        label: t("module"),
        value: {
          name: Attribute.Module,
          type: AttributeType.Text,
        },
      },
      {
        label: t("name"),
        value: {
          name: Attribute.Name,
          type: AttributeType.Text,
        },
      },
      {
        label: t("networkClass"),
        value: {
          name: Attribute.NetworkClass,
          type: AttributeType.Enum,
          choices: [
            { label: t("firewall"), value: DeviceNetworkClass.Firewall },
            {
              label: t("loadBalancer"),
              value: DeviceNetworkClass.LoadBalancer,
            },
            { label: t("router"), value: DeviceNetworkClass.Router },
            { label: t("server"), value: DeviceNetworkClass.Server },
            { label: t("switch"), value: DeviceNetworkClass.Switch },
            {
              label: t("switchRouter"),
              value: DeviceNetworkClass.SwitchRouter,
            },
            { label: t("accessPoint"), value: DeviceNetworkClass.AccessPoint },
            {
              label: t("wirelessController"),
              value: DeviceNetworkClass.WirelessController,
            },
            {
              label: t("consoleServer"),
              value: DeviceNetworkClass.ConsoleServer,
            },
            { label: t("unknown3"), value: DeviceNetworkClass.Unknown },
          ],
        },
      },
      {
        label: t("softwareLevel2"),
        value: {
          name: Attribute.SoftwareLevel,
          type: AttributeType.Enum,
          choices: [
            { label: t("gold"), value: DeviceSoftwareLevel.GOLD },
            { label: t("silver"), value: DeviceSoftwareLevel.SILVER },
            { label: t("bronze"), value: DeviceSoftwareLevel.BRONZE },
            { label: t("unknown3"), value: DeviceSoftwareLevel.UNKNOWN },
          ],
        },
      },
      {
        label: t("softwareVersion"),
        value: {
          name: Attribute.SoftwareVersion,
          type: AttributeType.Text,
        },
      },
      {
        label: t("status"),
        value: {
          name: Attribute.Status,
          type: AttributeType.Enum,
          choices: [
            { label: t("production"), value: DeviceStatus.Production },
            { label: t("disabled"), value: DeviceStatus.Disabled },
            { label: t("preproduction"), value: DeviceStatus.PreProduction },
          ],
        },
      },
      {
        label: t("type"),
        value: {
          name: Attribute.Type,
          type: AttributeType.Enum,
          choices: deviceTypeOptions.getOptionsWithName(),
        },
      },
      {
        label: t("virtualName"),
        value: {
          name: Attribute.VirtualName,
          type: AttributeType.Text,
        },
      },
      {
        label: t("vrf"),
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
            label: t("confirming"),
            value: DeviceComplianceResultType.Conforming,
          },
          {
            label: t("nonConforming"),
            value: DeviceComplianceResultType.NonConfirming,
          },
          {
            label: t("notApplicable"),
            value: DeviceComplianceResultType.NotApplication,
          },
          { label: t("exempted"), value: DeviceComplianceResultType.Exempted },
          { label: t("disabled"), value: DeviceComplianceResultType.Disabled },
          {
            label: t("invalidRule"),
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
