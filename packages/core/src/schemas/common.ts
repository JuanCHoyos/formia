import { z } from 'zod';

export const IdSchema = z.ulid();
export const IdParamsSchema = z.object({ id: IdSchema });
export const OwnerIdParamsSchema = z.object({ ownerId: IdSchema });
export const EmailParamsSchema = z.object({ email: z.email() });
export const UserRoleSchema = z.enum(['FORM_CREATOR', 'FORM_RESPONDENT']);
export const AuthProviderSchema = z.enum(['SYSTEM', 'Google', 'Facebook', 'Apple']);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;
export type ExternalAuthProvider = Exclude<AuthProvider, 'SYSTEM'>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export const FormContentSchema = z.record(z.string(), z.unknown());
export const AnswerSchema = z.record(z.string(), z.unknown());
