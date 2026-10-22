import { z } from 'zod';

export const ApiErrorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'USER_NOT_FOUND',
  'USER_ALREADY_EXISTS',
  'FORM_NOT_FOUND',
  'FORM_ALREADY_EXISTS',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'NOT_FOUND',
  'UNKNOWN_ERROR',
]);

/** Used when a failure doesn't come with a known code (network errors, unexpected responses). */
export const DEFAULT_API_ERROR_CODE = 'UNKNOWN_ERROR' satisfies ApiErrorCode;

export const ApiErrorBodySchema = z.object({
  success: z.literal(false),
  code: ApiErrorCodeSchema,
  message: z.string(),
});

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
}
