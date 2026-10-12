/**
 * The single place the frontend talks to the backend.
 *
 * Paths are relative to /v1: production serves this build from the backend's own
 * origin, and vite.config.ts proxies /v1 in development. Same-origin in both, so
 * the httpOnly session cookie travels on its own and there is no CORS to configure.
 */

import type { paths } from "./openapi.gen";
import type { Concat } from "../utils/stringcheck";

type ApiPath = keyof paths & string;
export type QueryString = Concat<"?", `${string}`>;
export type ApiRequestPath = ApiPath | Concat<ApiPath, QueryString>;

/** Path prefix. Also the document's server URL - see backend/src/docs/api/openapi.yaml. */
const BASE = '/v1';

export interface FieldError {
  pointer: string;
  detail: string;
}

/**
 * A non-2xx response, carrying the problem details the API returned. `detail` is
 * written to be read by a person and is safe to surface in the UI; branch on
 * `status`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly errors: FieldError[];

  constructor(status: number, title: string, detail: string, errors: FieldError[] = []) {
    super(detail || title);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

type ProblemBody = {
  title?: string;
  status?: number;
  detail?: string;
  errors?: FieldError[];
}

/**
 * Turns a failed response into an ApiError. A body is expected but not required -
 * a proxy or an upstream crash never passed through the API's own handler.
 */
async function toApiError(response: Response): Promise<ApiError> {
  let problem: ProblemBody = {};
  try {
    const text = await response.text();
    if (text) problem = JSON.parse(text) as ProblemBody;
  } catch {
    // Not JSON. Fall through to the status-derived message below.
  }

  return new ApiError(
    response.status,
    problem.title || response.statusText || 'Request failed',
    problem.detail || `The server responded with ${response.status}.`,
    problem.errors ?? [],
  );
}

/**
 * Sends a request and returns the parsed body, throwing ApiError on any non-2xx.
 *
 * `credentials: 'include'` is redundant while same-origin, and keeps auth working
 * if VITE_API_TARGET ever points elsewhere.
 */
export async function request<T>(path: ApiRequestPath, init: RequestInit = {}): Promise<T> {
  console.log(`API request: ${path}`);
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (cause) {
    // fetch only rejects when no answer arrived at all. Status 0 marks that, so
    // callers can tell it apart from a 500.
    throw new ApiError(0, 'Network error', 'Could not reach the server. Is the backend running?', [
      { pointer: '', detail: String(cause) },
    ]);
  }

  if (!response.ok) throw await toApiError(response);

  // 204, or any response the caller expects nothing from.
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const post = <T>(path: ApiRequestPath, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const get = <T>(path: ApiRequestPath) => request<T>(path, { method: 'GET' });
