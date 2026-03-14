import http from "node:http";
import https from "node:https";

const ZULIP_API_BASE = "/api/v1";

export type ApiResponse = {
  status: number;
  body: Record<string, unknown>;
};

type RequestOptions = {
  signal?: AbortSignal;
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
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value.toString();
  }
  return JSON.stringify(value);
};

export class ApiClient {
  private baseUrl: string;
  private authHeader?: string;
  private hostHeader?: string;

  constructor(baseUrl: string, email: string, apiKey: string, hostHeader?: string) {
    this.baseUrl = baseUrl;
    this.authHeader = "Basic " + Buffer.from(`${email}:${apiKey}`).toString("base64");
    this.hostHeader = hostHeader;
  }

  static bearer(baseUrl: string, token: string, hostHeader?: string): ApiClient {
    const client = new ApiClient(baseUrl, "", "", hostHeader);
    client.authHeader = `Bearer ${token}`;
    return client;
  }

  private withAuthHeaders(extra?: Record<string, string>): Record<string, string> {
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

  async get(path: string, params?: Record<string, string>, options?: RequestOptions): Promise<ApiResponse> {
    const url = new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return this.request(url, "GET", undefined, options);
  }

  async post(path: string, data?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "POST",
      data,
      options,
    );
  }

  async patch(path: string, data?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "PATCH",
      data,
      options,
    );
  }

  async put(path: string, data?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "PUT",
      data,
      options,
    );
  }

  async delete(path: string, data?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(
      new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`),
      "DELETE",
      data,
      options,
    );
  }

  async postRaw(path: string, data?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(new URL(`${this.baseUrl}${path}`), "POST", data, options);
  }

  async getRaw(path: string, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(new URL(`${this.baseUrl}${path}`), "GET", undefined, options);
  }

  async patchRaw(path: string, data?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse> {
    return this.request(new URL(`${this.baseUrl}${path}`), "PATCH", data, options);
  }

  private async request(
    url: URL,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse> {
    const payload = data
      ? new URLSearchParams(
          Object.entries(data).map(([key, value]) => [key, toFormFieldValue(value)]),
        ).toString()
      : undefined;
    const headers = this.withAuthHeaders(
      payload === undefined
        ? undefined
        : {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(payload).toString(),
          },
    );
    const transport = url.protocol === "https:" ? https : http;

    return await new Promise<ApiResponse>((resolve, reject) => {
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
            const text = Buffer.concat(chunks).toString("utf8");
            if (text === "") {
              resolve({ status: res.statusCode ?? 0, body: {} });
              return;
            }

            try {
              resolve({
                status: res.statusCode ?? 0,
                body: JSON.parse(text) as Record<string, unknown>,
              });
            } catch (error) {
              reject(
                new Error(
                  `Failed to parse JSON response for ${method} ${url.toString()}: ${text}`,
                  { cause: error },
                ),
              );
            }
          });
        },
      );

      req.on("error", reject);

      if (payload !== undefined) {
        req.write(payload);
      }

      req.end();
    });
  }
}

export const createApiClient = (baseUrl: string, email: string, apiKey: string, hostHeader?: string): ApiClient => {
  return new ApiClient(baseUrl, email, apiKey, hostHeader);
};
