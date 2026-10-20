import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ExternalAuthProvider } from '@formly/core/schemas/common';
import type { CreateUserProfileInput, UserProfile } from '@formly/core/schemas/user';
import type { ConfirmForgotPasswordInput, ConfirmSignUpInput, ForgotPasswordInput, SignInInput, SignUpInput } from '@formly/core/schemas/auth';
import { firstValueFrom } from 'rxjs';
import {
    signInWithRedirect,
    signUp,
    signIn,
    confirmSignUp,
    resetPassword,
    confirmResetPassword,
} from 'aws-amplify/auth';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })

export class AuthApi {
    private readonly http = inject(HttpClient);


    async signIn(signInInput: SignInInput) {
        return signIn({
            username: signInInput.email,
            password: signInInput.password,
        });
    }

    async signInWithProvider(provider: ExternalAuthProvider) {
        try {
            await signInWithRedirect({ provider: provider });
        } catch (error) {
            throw error;
        }
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
        const response = await firstValueFrom(
            this.http.post<{ data: UserProfile }>(
                `${environment.API_URL}/users`,
                input,
            ),
        );
        return response.data;
    }
}