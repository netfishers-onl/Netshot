import withQuery, { WithQueryOptions } from "with-query";

import i18n from "@/i18n";

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

type HttpPayload<B> = {
  body?: B;
  queryParams?: Record<string, unknown>;
  queryParamsOptions?: WithQueryOptions;
  headers?: Record<string, string>;
};

type HttpClientOptions = {
  baseUrl?: string;
};

export type NetshotError = {
  title: string;
  description: string;
  code: NetshotErrorCode;
  response?: Response;
}

export enum NetshotErrorCode {
  GenericServer = -1,
  DeviceNotFound = 142,
}

export enum HttpStatus {
  Ok = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  PreconditionFailed = 412,
  InternalServerError = 500,
}

export enum HttpEventType {
  Forbidden = "forbidden",
}

export type HttpEventCallback = (url: string, params: RequestInit, response: Response) => void;

function createHttpClient(opts: HttpClientOptions = {}) {
  const { baseUrl = "" } = opts;
  const listeners = new Map<HttpEventType, HttpEventCallback>();

  async function request<B = object>(
      method: HttpMethod, url: string, payload: HttpPayload<B> = {}): Promise<Response> {
    const {
      body,
      queryParams,
      queryParamsOptions = {},
      headers = {},
    } = payload;

    const requestUrl = baseUrl +
      (queryParams ? withQuery(url, queryParams, queryParamsOptions) : url);

    if (!headers["Accept"]) {
      headers["Accept"] = "application/json";
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (typeof body === "object") {
      requestOptions.body = JSON.stringify(body as B);
      headers["Content-Type"] = "application/json";
    }
    else if (body && headers["Content-Type"]) {
      requestOptions.body = body as string;
    }

    const response = await fetch(requestUrl, requestOptions);

    if (!response.ok) {
      if (response.status === HttpStatus.Forbidden) {
        for (const [type, callback] of listeners) {
          if (type === HttpEventType.Forbidden) {
            callback(requestUrl, requestOptions, response);
          }
        }
      }
      try {
        const result = await response.json();
        if (result.errorMsg) {
          throw {
            title: i18n.t("Error"),
            description: i18n.t(result.errorMsg),
            code: result.errorCode,
            response,
          } as NetshotError;
        }
      }
      catch (jsonErr) {
        throw {
          title: i18n.t("Error"),
          description: i18n.t("Netshot server error"),
          code: NetshotErrorCode.GenericServer,
          response,
        } as NetshotError;
      }
    }

    return response;
  }

  return {
    request,

    async get<R>(url: string, payload: HttpPayload<null> = {}) {
      const response = await request<null>(HttpMethod.GET, url, payload);
      try {
        return await response.json() as R;
      }
      catch (e) {
        return null;
      }
    },

    async post<R, B>(
      url: string,
      body: B,
      meta: Omit<HttpPayload<B>, "body"> = {}
    ) {
      const response = await request<B>(HttpMethod.POST, url, {
        ...meta,
        body,
      });
      try {
        return await response.json() as R;
      }
      catch (e) {
        return null;
      }
    },

    async put<R, B>(
      url: string,
      body: B,
      meta: Omit<HttpPayload<B>, "body"> = {}
    ) {
      const response = await request<B>(HttpMethod.PUT, url, {
        ...meta,
        body,
      });
      try {
        return await response.json() as R;
      }
      catch (e) {
        return null;
      }
    },

    async patch<R, B>(
      url: string,
      body: B,
      meta: HttpPayload<B> = {}
    ) {
      const response = await request<B>(HttpMethod.PATCH, url, {
        ...meta,
        body,
      });
      try {
        return await response.json() as R;
      }
      catch (e) {
        return null;
      }
    },

    async delete(url: string, payload: HttpPayload<null> = {}) {
      await request<null>(HttpMethod.DELETE, url, payload);
    },

    on(type: HttpEventType, callback: HttpEventCallback) {
      listeners.set(type, callback);
    },

    off(type: HttpEventType) {
      listeners.delete(type);
    },
  };
}

export default createHttpClient({
  baseUrl: "/api",
});
