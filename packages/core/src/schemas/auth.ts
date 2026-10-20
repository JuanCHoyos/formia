import { z } from "zod";

export const PasswordSchema = z
  .string()
  .min(8, 'auth.validation.passwordPolicy')
  .max(256, 'auth.validation.passwordPolicy')
  .regex(/[a-z]/, 'auth.validation.passwordPolicy')
  .regex(/[A-Z]/, 'auth.validation.passwordPolicy')
  .regex(/[0-9]/, 'auth.validation.passwordPolicy')
  .regex(/[^a-zA-Z0-9\s]/, 'auth.validation.passwordPolicy')
  .regex(/^\S+$/, 'auth.validation.passwordPolicy');

export const SignUpSchema = z
  .object({
    email: z.email(),
    name: z.string().min(3),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .strict();

export const ConfirmSignUpSchema = z
  .object({
    email: z.email(),
    code: z.string().min(1),
  })
  .strict();

export const SignInSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .strict();


export const ForgotPasswordSchema = z
  .object({
    email: z.email(),
  })
  .strict();


export const ConfirmForgotPasswordSchema = z
  .object({
    email: z.email(),
    code: z.string().min(1),
    newPassword: PasswordSchema,
  })
  .strict();

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type ConfirmForgotPasswordInput = z.infer<typeof ConfirmForgotPasswordSchema>;
export type ConfirmSignUpInput = z.infer<typeof ConfirmSignUpSchema>;

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;