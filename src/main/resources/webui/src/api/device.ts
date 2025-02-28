import {
  Device,
  DeviceComplianceResult,
  DeviceConfig,
  DeviceDiagnosticResult,
  DeviceFamily,
  DeviceInterface,
  DeviceModule,
  DeviceType,
  SimpleDevice,
} from "@/types";
import { Task } from "@/types/task";
import { sortByDate } from "@/utils";
import httpClient, { HttpMethod, HttpStatus, NetshotError } from "./httpClient";
import {
  CreateDevicePayload,
  DeviceModuleQueryParams,
  DeviceQueryParams,
  DeviceSearchPayload,
  DeviceSearchResult,
  PaginationQueryParams,
  UpdateDevicePayload,
} from "./types";

async function search(payload: DeviceSearchPayload) {
  return httpClient.post<DeviceSearchResult, DeviceSearchPayload>(
    "/devices/search",
    payload
  );
}

async function getAll(queryParams: DeviceQueryParams = {}) {
  return httpClient.get<SimpleDevice[]>("/devices", {
    queryParams,
  });
}

async function getById(id: number) {
  return httpClient.get<Device>(`/devices/${id}`);
}

async function create(payload: CreateDevicePayload) {
  return httpClient.post<Task, CreateDevicePayload>("/devices", payload);
}

async function update(id: number, payload: Partial<UpdateDevicePayload>) {
  return httpClient.put<Device, Partial<UpdateDevicePayload>>(
    `/devices/${id}`,
    payload
  );
}

async function remove(id: number) {
  const req = await httpClient.rawRequest(HttpMethod.Delete, `/devices/${id}`);
  return req.status === HttpStatus.NoContent;
}

async function getComplianceResultById(
  id: number,
  queryParams: PaginationQueryParams = {}
) {
  return httpClient.get<DeviceComplianceResult[]>(
    `/devices/${id}/complianceresults`,
    {
      queryParams,
    }
  );
}

async function getDiagnosticResultById(
  id: number,
  queryParams: PaginationQueryParams = {}
) {
  return httpClient.get<DeviceDiagnosticResult[]>(
    `/devices/${id}/diagnosticresults`,
    {
      queryParams,
    }
  );
}

async function getAllConfigById(
  id: number,
  queryParams: PaginationQueryParams = {}
) {
  return httpClient.get<DeviceConfig[]>(`/devices/${id}/configs`, {
    queryParams,
  });
}

/**
 * @todo: Add endpoint to get config from device by id
 */
async function getConfigById(deviceId: number, id: number) {
  let configs = [];

  try {
    configs = await getAllConfigById(deviceId, {
      limit: 999999,
    });
  } catch (err) {
    throw err as NetshotError;
  }

  return configs.find((config) => config.id === id);
}

/**
 * @todo: Add endpoint to get current config from device
 */
async function getCurrentConfig(deviceId: number) {
  try {
    const [config] = await getAllConfigById(deviceId, {
      limit: 1,
    });

    return config;
  } catch (err) {
    throw err;
  }
}

/**
 * @todo: Add endpoint to get previous config from other config
 */
async function getPreviousConfig(deviceId: number, id: number) {
  try {
    const configs = await getAllConfigById(deviceId);
    const configIndex = sortByDate(configs, "changeDate").findIndex(
      (config) => config.id === id
    );

    if (configIndex === -1) {
      return null;
    }

    return configs?.[configIndex + 1];
  } catch (err) {
    throw err;
  }
}

async function getAllInterfaceById(
  id: number,
  queryParams: PaginationQueryParams = {}
) {
  return httpClient.get<DeviceInterface[]>(`/devices/${id}/interfaces`, {
    queryParams,
  });
}

async function getAllModuleById(
  id: number,
  queryParams: DeviceModuleQueryParams = {}
) {
  return httpClient.get<DeviceModule[]>(`/devices/${id}/modules`, {
    queryParams,
  });
}

async function getAllTaskById(
  id: number,
  queryParams: PaginationQueryParams = {}
) {
  return httpClient.get<DeviceModule[]>(`/devices/${id}/tasks`, {
    queryParams,
  });
}

async function getAllFamily(queryParams: PaginationQueryParams = {}) {
  return httpClient.get<DeviceFamily[]>("/devicefamilies", {
    queryParams,
  });
}

async function getAllPartNumber(queryParams: PaginationQueryParams = {}) {
  return httpClient.get<
    Array<{
      partNumber: string;
    }>
  >(`/partnumbers`, {
    queryParams,
  });
}

async function getAllType() {
  return httpClient.get<DeviceType[]>(`/devicetypes`);
}

export default {
  search,
  getAll,
  getById,
  create,
  update,
  remove,
  getComplianceResultById,
  getDiagnosticResultById,
  getAllConfigById,
  getConfigById,
  getCurrentConfig,
  getPreviousConfig,
  getAllInterfaceById,
  getAllModuleById,
  getAllTaskById,
  getAllFamily,
  getAllPartNumber,
  getAllType,
};
