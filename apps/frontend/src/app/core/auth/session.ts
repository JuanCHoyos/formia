import { inject, Service } from '@angular/core';
import { apiClient } from '../api/api-client';
import { UserStore } from './user-store';

export type SessionStatus = 'unauthenticated' | 'unregistered' | 'registered';

const HTTP_NOT_FOUND = 404;

@Service()
export class Session {
  private readonly userStore = inject(UserStore);

  /**
   * Resolves the session against the backend, which validates the Cognito tokens,
   * and keeps the user store in sync:
   * - `registered`: valid tokens and the user exists in the database.
   * - `unregistered`: valid tokens but the user was never created (404 from `/users/me`).
   * - `unauthenticated`: missing/invalid tokens or any other failure.
   */
  async resolve(): Promise<SessionStatus> {
    try {
      const response = await apiClient.users.me.get();

      if (response.error) {
        this.userStore.clear();
        return response.status === HTTP_NOT_FOUND ? 'unregistered' : 'unauthenticated';
      }

      if (!response.data.success) {
        this.userStore.clear();
        return 'unauthenticated';
      }

      this.userStore.set(response.data.data);
      return 'registered';
    } catch {
      this.userStore.clear();
      return 'unauthenticated';
    }
  }
}
