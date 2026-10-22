import {
  ApiErrorBodySchema,
  DEFAULT_API_ERROR_CODE,
  type ApiErrorCode,
  type ApiSuccessBody,
} from '@formly/core/schemas/api';

const DEFAULT_API_ERROR_MESSAGE = 'An unexpected error occurred';

export interface ApiError {
  status: number;
  code: ApiErrorCode;
  message: string;
}

export class ApiSuccess<T> {
  constructor(readonly data: T) {}

  isSuccess(): this is ApiSuccess<T> {
    return true;
  }

  isError(): this is ApiFailure {
    return false;
  }
}

export class ApiFailure {
  constructor(readonly error: ApiError) {}

  isSuccess(): this is never {
    return false;
  }

  isError(): this is ApiFailure {
    return true;
  }
}

export type ApiResult<T> = ApiFailure | ApiSuccess<T>;

interface EdenResponse<TBody> {
  data: TBody | null;
  error: { value: unknown } | null;
  status: number;
}

/**
 * Turns an Eden request into an `ApiResult`: the success body is unwrapped to its `data`, and
 * every failure (error status, network error, missing session) becomes an `ApiError`.
 */
export async function apiResult<TBody extends ApiSuccessBody<unknown>>(
  request: Promise<EdenResponse<TBody>>,
): Promise<ApiResult<TBody['data']>> {
  try {
    const response = await request;

    if (response.error === null && response.data !== null) {
      return new ApiSuccess(response.data.data);
    }

    return new ApiFailure(toApiError(response.status, response.error?.value));
  } catch {
    return new ApiFailure(toApiError(0, undefined));
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const parsed = ApiErrorBodySchema.safeParse(body);

  return parsed.success
    ? { status, code: parsed.data.code, message: parsed.data.message }
    : { status, code: DEFAULT_API_ERROR_CODE, message: DEFAULT_API_ERROR_MESSAGE };
}
