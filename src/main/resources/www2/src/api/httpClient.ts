import i18n from "@/i18n";
import withQuery, { WithQueryOptions } from "with-query";

export enum HttpMethod {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Delete = "DELETE",
  Patch = "PATCH",
}

type HttpPayload = {
  body?: Record<string, unknown>;
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
  status: HttpStatus;
};

export enum NetshotErrorCode {
  DeviceNotFound = 142,
}

export enum HttpStatus {
  Ok = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  NotFound = 404,
  Forbidden = 403,
  InternalServerError = 500,
}

export enum HttpEventType {
  Forbidden = "forbidden",
}

type HttpEventCallback = () => void;

export const listeners = new Map<HttpEventType, HttpEventCallback>();

function createHttpClient(opts: HttpClientOptions = {}) {
  const { baseUrl = "" } = opts;

  function prepareRequestParams<B extends HttpPayload["body"] = {}>(
    method: HttpMethod,
    url: string,
    payload: HttpPayload = {}
  ) {
    const { body, queryParams, queryParamsOptions = {}, headers } = payload;

    let requestHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    if (queryParams) {
      url = withQuery(url, queryParams, queryParamsOptions);
    }

    if (headers) {
      requestHeaders = {
        ...requestHeaders,
        ...headers,
      };
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      requestOptions.body = JSON.stringify(body as B);
    }

    return {
      options: requestOptions,
      url: `${baseUrl}${url}`,
    };
  }

  async function request<R, B extends HttpPayload["body"] = {}>(
    method: HttpMethod,
    url: string,
    payload: HttpPayload = {}
  ) {
    const params = prepareRequestParams<B>(method, url, payload);
    const req = await fetch(params.url, params.options);

    if (req.status === HttpStatus.InternalServerError) {
      throw {
        title: i18n.t("Error"),
        description: i18n.t("An error occurred"),
      };
    } else if (req.status === HttpStatus.NotFound) {
      throw {
        title: i18n.t("Error"),
        description: i18n.t("Entity not found"),
      };
    }

    if (req.status === HttpStatus.Forbidden) {
      for (const [type, callback] of listeners) {
        if (type === HttpEventType.Forbidden) {
          callback();
        }
      }

      return null;
    }

    const res = await req.json();

    if (res?.errorMsg) {
      throw {
        title: i18n.t("Error"),
        description: res?.errorMsg,
        code: res?.errorCode,
        status: req.status,
      } as NetshotError;
    }

    return res as R;
  }

  async function rawRequest<B extends HttpPayload["body"] = {}>(
    method: HttpMethod,
    url: string,
    payload: HttpPayload = {}
  ) {
    const {
      body,
      queryParams,
      queryParamsOptions = {},
      headers = {},
    } = payload;

    if (queryParams) {
      url = withQuery(url, queryParams, queryParamsOptions);
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      requestOptions.body = JSON.stringify(body as B);
    }

    const req = await fetch(`${baseUrl}${url}`, requestOptions);

    if (req.status === HttpStatus.InternalServerError) {
      throw {
        title: i18n.t("Error"),
        description: i18n.t("An error occurred"),
      };
    }

    if (req.status === HttpStatus.Forbidden) {
      for (const [type, callback] of listeners) {
        if (type === HttpEventType.Forbidden) {
          callback();
        }
      }

      return null;
    }

    return req;
  }

  return {
    request,
    rawRequest,

    async get<R>(url: string, payload: HttpPayload = {}) {
      return await request<R>(HttpMethod.Get, url, payload);
    },

    async post<R, B extends HttpPayload["body"]>(
      url: string,
      body: B,
      payload: Omit<HttpPayload, "body"> = {}
    ) {
      return await request<R, B>(HttpMethod.Post, url, {
        ...payload,
        body,
      });
    },

    async put<R, B extends HttpPayload["body"]>(
      url: string,
      body: B,
      payload: Omit<HttpPayload, "body"> = {}
    ) {
      return await request<R, B>(HttpMethod.Put, url, {
        ...payload,
        body,
      });
    },

    async patch<R, B extends HttpPayload["body"]>(
      url: string,
      body: B,
      payload: HttpPayload = {}
    ) {
      return await request<R, B>(HttpMethod.Patch, url, {
        ...payload,
        body,
      });
    },

    async delete<R>(url: string, payload: HttpPayload = {}) {
      return await request<R>(HttpMethod.Delete, url, payload);
    },

    on(type: HttpEventType, callback: HttpEventCallback) {
      listeners.set(type, callback);
    },
  };
}

export default createHttpClient({
  baseUrl: "/api",
});
