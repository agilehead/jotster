const ZULIP_API_BASE = "/api/v1";

export type ApiResponse = {
  status: number;
  body: Record<string, unknown>;
};

export class ApiClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(baseUrl: string, email: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.authHeader = "Basic " + Buffer.from(`${email}:${apiKey}`).toString("base64");
  }

  async get(path: string, params?: Record<string, string>): Promise<ApiResponse> {
    const url = new URL(`${this.baseUrl}${ZULIP_API_BASE}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: this.authHeader },
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  }

  async post(path: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}${ZULIP_API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data ? new URLSearchParams(data as Record<string, string>).toString() : undefined,
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  }

  async patch(path: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}${ZULIP_API_BASE}${path}`, {
      method: "PATCH",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data ? new URLSearchParams(data as Record<string, string>).toString() : undefined,
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  }

  async put(path: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}${ZULIP_API_BASE}${path}`, {
      method: "PUT",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data ? new URLSearchParams(data as Record<string, string>).toString() : undefined,
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  }

  async delete(path: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    const headers: Record<string, string> = { Authorization: this.authHeader };
    let reqBody: string | undefined;
    if (data) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      reqBody = new URLSearchParams(data as Record<string, string>).toString();
    }
    const res = await fetch(`${this.baseUrl}${ZULIP_API_BASE}${path}`, {
      method: "DELETE",
      headers,
      body: reqBody,
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  }

  async postRaw(path: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data ? new URLSearchParams(data as Record<string, string>).toString() : undefined,
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  }

  async getRaw(path: string): Promise<ApiResponse> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: { Authorization: this.authHeader },
    });
    const body = (await res.json()) as Record<string, unknown>;
    return { status: res.status, body };
  }
}

export const createApiClient = (baseUrl: string, email: string, apiKey: string): ApiClient => {
  return new ApiClient(baseUrl, email, apiKey);
};
