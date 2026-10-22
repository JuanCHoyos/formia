import type { ApiErrorCode, ApiSuccessBody } from "@formly/core/schemas/api";

export const ok = <T>(message: string, data: T): ApiSuccessBody<T> => ({
  success: true,
  message,
  data,
});

export const fail = <C extends ApiErrorCode>(code: C, message: string) => ({
  success: false as const,
  code,
  message,
});
