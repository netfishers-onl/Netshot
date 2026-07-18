import {
  ConfigComplianceDeviceStatus,
  DeviceAccessFailure,
  DeviceSoftwareLevel,
  GroupConfigComplianceStat,
  GroupDeviceBySoftwareLevel,
  GroupSoftwareComplianceStat,
  HardwareSupportDevice,
  HardwareSupportStat,
} from "@/types"
import { getFilenameFromContentDispositionHeader } from "@/utils"
import httpClient, { HttpMethod } from "./httpClient"
import {
  ReportDeviceAccessFailureQueryParams,
  ReportExportDataQueryParams,
  ReportHardwareSupportQueryParams,
  ReportQueryParams,
} from "./types"

async function getAllConfigComplianceDeviceStatuses(queryParams: ReportQueryParams) {
  return httpClient.get<ConfigComplianceDeviceStatus[]>("/reports/configcompliancedevicestatuses", {
    queryParams,
  })
}

async function getAllGroupConfigComplianceStats(queryParams: ReportQueryParams) {
  return httpClient.get<GroupConfigComplianceStat[]>("/reports/groupconfigcompliancestats", {
    queryParams,
    queryParamsOptions: {
      stringifyOpt: {
        arrayFormat: "repeat",
      },
    },
  })
}

async function getAllDeviceAccessFailures(queryParams: ReportDeviceAccessFailureQueryParams) {
  return httpClient.get<DeviceAccessFailure[]>("/reports/accessfailuredevices", {
    queryParams,
  })
}

async function getAllGroupConfigNonCompliantDevices(
  id: number,
  queryParams: ReportQueryParams = {}
) {
  return httpClient.get<ConfigComplianceDeviceStatus[]>(
    `/reports/groupconfignoncompliantdevices/${id}`,
    {
      queryParams,
    }
  )
}

async function getAllGroupDevicesBySoftwareLevel(
  id: number,
  level: DeviceSoftwareLevel,
  queryParams: ReportQueryParams = {}
) {
  return httpClient.get<GroupDeviceBySoftwareLevel[]>(
    `/reports/groupdevicesbysoftwarelevel/${id}/${level?.toLocaleLowerCase()}`,
    {
      queryParams,
    }
  )
}

async function getAllGroupSoftwareComplianceStats(
  queryParams: {
    domain?: number
  } = {}
) {
  return httpClient.get<GroupSoftwareComplianceStat[]>("/reports/groupsoftwarecompliancestats", {
    queryParams,
  })
}

async function getAllHardwareSupportDevices(
  type: "eos" | "eol",
  date: number,
  queryParams: ReportHardwareSupportQueryParams = {}
) {
  return httpClient.get<HardwareSupportDevice[]>(`/reports/hardwaresupportdevices/${type}/${date}`, {
    queryParams,
    queryParamsOptions: {
      stringifyOpt: {
        arrayFormat: "repeat",
      },
    },
  })
}

async function getAllHardwareSupportStats(queryParams: ReportHardwareSupportQueryParams = {}) {
  return httpClient.get<HardwareSupportStat[]>(`/reports/hardwaresupportstats`, {
    queryParams,
    queryParamsOptions: {
      stringifyOpt: {
        arrayFormat: "repeat",
      },
    },
  })
}

async function exportData(queryParams: ReportExportDataQueryParams) {
  const req = await httpClient.request(HttpMethod.GET, "/reports/export", {
    headers: {
      "Accept": "*/*",
    },
    queryParams,
    queryParamsOptions: {
      stringifyOpt: {
        arrayFormat: "repeat",
      },
    },
  })

  return {
    blob: await req.blob(),
    filename: getFilenameFromContentDispositionHeader(req.headers),
  }
}

export default {
  getAllConfigComplianceDeviceStatuses,
  getAllGroupConfigComplianceStats,
  getAllGroupConfigNonCompliantDevices,
  getAllGroupDevicesBySoftwareLevel,
  getAllGroupSoftwareComplianceStats,
  getAllHardwareSupportDevices,
  getAllHardwareSupportStats,
  getAllDeviceAccessFailures,
  exportData,
}
