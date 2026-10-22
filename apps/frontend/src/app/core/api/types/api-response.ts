import type { ApiErrorCode } from '@formly/core/schemas/api';

export interface ApiError {
  status: number;
  code: ApiErrorCode;
  message: string;
}

export interface EdenResponse<TBody> {
  data: TBody | null;
  error: { value: unknown } | null;
  status: number;
}
