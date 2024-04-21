import {
  ConfigComplianceDeviceStatus,
  DeviceAccessFailure,
  DeviceComplianceResultType,
  DeviceSoftwareLevel,
  GroupConfigComplianceStat,
  GroupDeviceBySoftwareLevel,
  GroupSoftwareComplianceStat,
  HardwareSupportDevice,
  HardwareSupportStat,
} from "@/types";
import { getFilenameFromContentDispositionHeader } from "@/utils";
import httpClient, { HttpMethod } from "./httpClient";
import { PaginationQueryParams } from "./types";

export type ReportQueryParams = Partial<{
  domain: number[];
  group: number[];
  policy: number[];
  result?: DeviceComplianceResultType[];
}>;

export type ReportExportDataQueryParams = {
  domain: number;
  group: number[];
  groups: boolean;
  interfaces: boolean;
  inventory: boolean;
  inventoryhistory: boolean;
  locations: boolean;
  compliance: boolean;
  devicedriverattributes: boolean;
};

export type ReportDeviceAccessFailureQueryParams = {
  days: number;
  domain?: number;
} & PaginationQueryParams;

async function getAllConfigComplianceDeviceStatus(
  queryParams: ReportQueryParams
) {
  return httpClient.get<ConfigComplianceDeviceStatus[]>(
    "/reports/configcompliancedevicestatuses",
    {
      queryParams,
    }
  );
}

async function getAllGroupConfigComplianceStat(queryParams: ReportQueryParams) {
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

async function getAllDeviceAccessFailure(
  queryParams: ReportDeviceAccessFailureQueryParams
) {
  return httpClient.get<DeviceAccessFailure[]>(
    "/reports/accessfailuredevices",
    {
      queryParams,
    }
  );
}

async function getAllGroupConfigNonCompliantDevice(
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

async function getAllGroupDeviceBySoftwareLevel(
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

async function getAllGroupSoftwareComplianceStat(
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

async function getAllHardwareSupportDevice(type: "eos" | "eol", date: number) {
  return httpClient.get<HardwareSupportDevice[]>(
    `/reports/hardwaresupportdevices/${type}/${date}`
  );
}

async function getAllHardwareSupportStat() {
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
  const req = await httpClient.rawRequest(HttpMethod.Get, "/reports/export", {
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
  getAllConfigComplianceDeviceStatus,
  getAllGroupConfigComplianceStat,
  getAllGroupConfigNonCompliantDevice,
  getAllGroupDeviceBySoftwareLevel,
  getAllGroupSoftwareComplianceStat,
  getAllHardwareSupportDevice,
  getAllHardwareSupportStat,
  getAllDeviceAccessFailure,
  getConfigChangeOverLastDay,
  exportData,
};
