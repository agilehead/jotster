import http from "node:http";
import https from "node:https";

const ZULIP_API_BASE = "/api/v1";

export type ApiResponse = {
  status: number;
  body: Record<string, unknown>;
};

export type BinaryApiResponse = {
  status: number;
  body: Buffer;
  headers: Record<string, string | string[] | undefined>;
};

type RequestOptions = {
  signal?: AbortSignal;
};

export type MultipartFile = {
  content: Buffer;
  contentType: string;
  filename: string;
  fieldName?: string;
};

const toFormFieldValue = (value: unknown): string => {
  if (value === undefined) {
    return "";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value.toString();
  }
  return JSON.stringify(value);
};

export class ApiClient {
  private baseUrl: string;
  private authHeader?: string;
  private hostHeader?: string;

  constructor(
    baseUrl: string,
    email: string,
    apiKey: string,
    hostHeader?: string,
  ) {
    this.baseUrl = baseUrl;
    this.authHeader =
      "Basic " + Buffer.from(`${email}:${apiKey}`).toString("base64");
    this.hostHeader = hostHeader;
  }

  static bearer(
    baseUrl: string,
    token: string,
    hostHeader?: string,
  ): ApiClient {
    const client = new ApiClient(baseUrl, "", "", hostHeader);
    client.authHeader = `Bearer ${token}`;
    return client;
  }

  private withAuthHeaders(
    extra?: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...(extra ?? {}),
    };
    if (this.authHeader !== undefined) {
      headers.Authorization = this.authHeader;
    }
    if (this.hostHeader !== undefined) {
      headers.Host = this.hostHeader;
    }
    return headers;
  }

  async get(
    path: string,
    params?: Record<string, string>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    const url = new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return this.request(url, "GET", undefined, options);
  }

  async post(
    path: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "POST",
      data,
      options,
    );
  }

  async patch(
    path: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "PATCH",
      data,
      options,
    );
  }

  async put(
    path: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "PUT",
      data,
      options,
    );
  }

  async delete(
    path: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "DELETE",
      data,
      options,
    );
  }

  async postRaw(
    path: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${path}`),
      "POST",
      data,
      options,
    );
  }

  async getRaw(path: string, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${path}`),
      "GET",
      undefined,
      options,
    );
  }

  async getRawBuffer(
    path: string,
    options?: RequestOptions,
  ): Promise<BinaryApiResponse> {
    return this.requestBuffer(
      new URL(`${this.baseUrl}${path}`),
      "GET",
      undefined,
      options,
    );
  }

  async patchRaw(
    path: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${path}`),
      "PATCH",
      data,
      options,
    );
  }

  async postMultipart(
    path: string,
    fields: Record<string, unknown> | undefined,
    file: MultipartFile,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    const boundary =
      "----jotster-test-boundary-" + Math.random().toString(16).slice(2);
    const buffers: Buffer[] = [];

    for (const [key, value] of Object.entries(fields ?? {})) {
      buffers.push(Buffer.from(`--${boundary}\r\n`));
      buffers.push(
        Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`),
      );
      buffers.push(Buffer.from(toFormFieldValue(value)));
      buffers.push(Buffer.from("\r\n"));
    }

    const fieldName = file.fieldName ?? "filename";
    buffers.push(Buffer.from(`--${boundary}\r\n`));
    buffers.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${fieldName}"; filename="${file.filename}"\r\n`,
      ),
    );
    buffers.push(Buffer.from(`Content-Type: ${file.contentType}\r\n\r\n`));
    buffers.push(file.content);
    buffers.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const response = await this.requestBuffer(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "POST",
      {
        payload: Buffer.concat(buffers),
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
      },
      options,
    );

    const text = response.body.toString("utf8");
    return {
      status: response.status,
      body: JSON.parse(text) as Record<string, unknown>,
    };
  }

  private async request(
    url: URL,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    const payload =
      data === undefined
        ? undefined
        : Buffer.from(
            new URLSearchParams(
              Object.entries(data).map(([key, value]) => [
                key,
                toFormFieldValue(value),
              ]),
            ).toString(),
          );
    const response = await this.requestBuffer(
      url,
      method,
      payload === undefined
        ? undefined
        : {
            payload,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
      options,
    );
    const text = response.body.toString("utf8");
    if (text === "") {
      return { status: response.status, body: {} };
    }

    return {
      status: response.status,
      body: JSON.parse(text) as Record<string, unknown>,
    };
  }

  private async requestBuffer(
    url: URL,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    request:
      | {
          payload: Buffer;
          headers?: Record<string, string>;
        }
      | undefined,
    options?: RequestOptions,
  ): Promise<BinaryApiResponse> {
    const transport = url.protocol === "https:" ? https : http;
    const headers = this.withAuthHeaders(
      request === undefined
        ? undefined
        : {
            ...(request.headers ?? {}),
            "Content-Length": request.payload.byteLength.toString(),
          },
    );

    return await new Promise<BinaryApiResponse>((resolve, reject) => {
      const req = transport.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          path: `${url.pathname}${url.search}`,
          method,
          headers,
          signal: options?.signal,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });
          res.on("end", () => {
            resolve({
              status: res.statusCode ?? 0,
              body: Buffer.concat(chunks),
              headers: res.headers,
            });
          });
        },
      );

      req.on("error", reject);

      if (request !== undefined) {
        req.write(request.payload);
      }

      req.end();
    });
  }
}

export const createApiClient = (
  baseUrl: string,
  email: string,
  apiKey: string,
  hostHeader?: string,
): ApiClient => {
  return new ApiClient(baseUrl, email, apiKey, hostHeader);
};
