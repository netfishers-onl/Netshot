import {
  ConfigComplianceDeviceStatus,
  DeviceAccessFailure,
  DeviceSoftwareLevel,
  GroupConfigComplianceStat,
  GroupDeviceBySoftwareLevel,
  GroupSoftwareComplianceStat,
  HardwareSupportDevice,
  HardwareSupportStat,
} from "@/types";
import { getFilenameFromContentDispositionHeader } from "@/utils";
import httpClient, { HttpMethod } from "./httpClient";
import {
  ReportDeviceAccessFailureQueryParams,
  ReportExportDataQueryParams,
  ReportQueryParams,
} from "./types";

async function getAllConfigComplianceDeviceStatuses(
  queryParams: ReportQueryParams
) {
  return httpClient.get<ConfigComplianceDeviceStatus[]>(
    "/reports/configcompliancedevicestatuses",
    {
      queryParams,
    }
  );
}

async function getAllGroupConfigComplianceStats(queryParams: ReportQueryParams) {
  return httpClient.get<GroupConfigComplianceStat[]>(
    "/reports/groupconfigcompliancestats",
    {
      queryParams,
      queryParamsOptions: {
        stringifyOpt: {
          arrayFormat: "repeat",
        },
      },
    }
  );
}

async function getAllDeviceAccessFailures(
  queryParams: ReportDeviceAccessFailureQueryParams
) {
  return httpClient.get<DeviceAccessFailure[]>(
    "/reports/accessfailuredevices",
    {
      queryParams,
    }
  );
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
  );
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
  );
}

async function getAllGroupSoftwareComplianceStats(
  queryParams: {
    domain?: number;
  } = {}
) {
  return httpClient.get<GroupSoftwareComplianceStat[]>(
    "/reports/groupsoftwarecompliancestats",
    {
      queryParams,
    }
  );
}

async function getAllHardwareSupportDevices(type: "eos" | "eol", date: number) {
  return httpClient.get<HardwareSupportDevice[]>(
    `/reports/hardwaresupportdevices/${type}/${date}`
  );
}

async function getAllHardwareSupportStats() {
  return httpClient.get<HardwareSupportStat[]>(`/reports/hardwaresupportstats`);
}

async function getConfigChangeOverLastDay() {
  return httpClient.get<Array<{ changeCount: number; changeDay: number }>>(
    `/reports/last7dayschangesbyday`,
    {
      queryParams: {
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }
  );
}

async function exportData(queryParams: ReportExportDataQueryParams) {
  const req = await httpClient.request(HttpMethod.GET, "/reports/export", {
    queryParams,
    queryParamsOptions: {
      stringifyOpt: {
        arrayFormat: "repeat",
      },
    },
  });

  return {
    blob: await req.blob(),
    filename: getFilenameFromContentDispositionHeader(req.headers),
  };
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
  getConfigChangeOverLastDay,
  exportData,
};
