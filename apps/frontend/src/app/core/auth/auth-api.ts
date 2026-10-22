import { Service } from '@angular/core';

import {
  signInWithRedirect,
  signUp,
  signIn,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth';

import type {
  ConfirmForgotPasswordInput,
  ConfirmSignUpInput,
  ForgotPasswordInput,
  SignInInput,
  SignUpInput,
} from '@formly/core/schemas/auth';
import type { ExternalAuthProvider } from '@formly/core/schemas/common';
import type { CreateUserProfileInput, UserProfile } from '@formly/core/schemas/user';

import { apiClient } from '../api/api-client';
import { apiResult } from '../api/api-result';

@Service()
export class AuthApi {
  async signIn(signInInput: SignInInput) {
    return signIn({
      username: signInInput.email,
      password: signInInput.password,
    });
  }

  async signInWithProvider(provider: ExternalAuthProvider) {
    // Amplify names only Cognito's built-in social providers; OIDC providers go by their name.
    await signInWithRedirect({ provider: provider === 'Google' ? provider : { custom: provider } });
  }

  async signUpWithEmail(user: SignUpInput) {
    return signUp({
      username: user.email,
      password: user.password,
      options: {
        userAttributes: {
          email: user.email,
          name: user.name,
        },
      },
    });
  }

  async confirmSignUpWithEmail(input: ConfirmSignUpInput) {
    return confirmSignUp({
      username: input.email,
      confirmationCode: input.code,
    });
  }

  async forgotPassword(input: ForgotPasswordInput) {
    return resetPassword({
      username: input.email,
    });
  }

  async confirmForgotPassword(input: ConfirmForgotPasswordInput) {
    return confirmResetPassword({
      username: input.email,
      confirmationCode: input.code,
      newPassword: input.newPassword,
    });
  }

  async completeRegistration(input: CreateUserProfileInput): Promise<UserProfile> {
    const result = await apiResult(apiClient.users.post(input));

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}
