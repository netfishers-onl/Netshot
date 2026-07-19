import api, { DeviceQueryParams } from "@/api"
import { QUERIES } from "@/constants"
import { sortAlphabetical } from "@/utils"
import { useQuery } from "@tanstack/react-query"

export function useDevice(id: number) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_DETAIL, id],
    queryFn: async () => api.device.getById(id),
  })
}

export function useDeviceTypes() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_TYPE_LIST],
    queryFn: async () => (await api.device.getAllTypes()) ?? [],
    initialData: [],
  })
}

export function useDeviceTypesWithOptions() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_TYPE_LIST],
    queryFn: async () => (await api.device.getAllTypes()) ?? [],
    select(types) {
      return types.map((type) => ({
        label: type?.description,
        value: type,
      }))
    },
    initialData: [],
  })
}

export function useCredentialSets() {
  return useQuery({
    queryKey: [QUERIES.CREDENTIAL_SET_LIST],
    queryFn: async () =>
      api.admin.getAllCredentialSets({}),
  })
}

export function useDeviceConfigs(deviceId: number | undefined) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_CONFIGS, deviceId],
    queryFn: async () => {
      return (await api.device.getAllConfigsById(deviceId!)) ?? []
    },
    enabled: !!deviceId,
  })
}

export function useDevices(groupId: number) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_LIST, groupId],
    queryFn: async () => {
      const params = {} as DeviceQueryParams

      if (groupId) {
        params.group = groupId
      }

      return (await api.device.getAll(params)) ?? []
    },
    select: (data) => sortAlphabetical(data, "name"),
  })
}

export function useDeviceFamilies() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_FAMILY_LIST],
    queryFn: async () => (await api.device.getAllFamilies({ limit: 99999 })) ?? [],
    select: (data) => Array.from(new Set(data.map((f) => f.deviceFamily).filter(Boolean))).sort(),
  })
}

export function useDevicePartNumbers() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_PART_NUMBER_LIST],
    queryFn: async () => (await api.device.getAllPartNumbers({ limit: 99999 })) ?? [],
    select: (data) => Array.from(new Set(data.map((p) => p.partNumber).filter(Boolean))).sort(),
  })
}

export function useDeviceSoftwareVersions() {
  return useQuery({
    queryKey: [QUERIES.DEVICE_SOFTWARE_VERSION_LIST],
    queryFn: async () => (await api.device.getAllSoftwareVersions({ limit: 99999 })) ?? [],
    select: (data) => Array.from(new Set(data.map((v) => v.version).filter(Boolean))).sort(),
  })
}

export function useSearchDevices(query: string) {
  return useQuery({
    queryKey: [QUERIES.DEVICE_SEARCH_LIST, query],
    queryFn: async () => (await api.device.search({ query })) ?? { query, devices: [] },
    select: (data) => ({ ...data, devices: sortAlphabetical(data.devices, "name") }),
  })
}
