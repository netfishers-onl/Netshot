import { AdminApi, Configuration, DevicesApi, LoginApi, ReportsApi, ReportsApiAxiosParamCreator, TasksApi } from "./api";

export const apiConfig = new Configuration({
	basePath: "/api",
});

export enum LoadStatus {
	INIT,
	LOADING,
	DONE,
	ERROR,
}

export const Api = {
	login: new LoginApi(apiConfig),
	admin: new AdminApi(apiConfig),
	tasks: new TasksApi(apiConfig),
	reports: new ReportsApi(apiConfig),
	reportsPC: ReportsApiAxiosParamCreator(apiConfig),
	devices: new DevicesApi(apiConfig),
};

export const IPV4_REGEXP =
	/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const HTTP_URL_REGEXP =
	/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

// Custom Set class to overcome serialization issue of standard Set
// i.e. JSON.stringify(new Set([1, 2])) ==> '{}'
export class SerializableSet<T> extends Set<T> {
	toJSON() {
		return Array.from(this);
	}
}
