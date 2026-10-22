import { inject, Service } from '@angular/core';

import { apiClient } from '../api/api-client';
import { apiResult } from '../api/api-result';
import type { SessionStatus } from './types/session-status';
import { UserStore } from './user-store';

@Service()
export class Session {
  private readonly userStore = inject(UserStore);

  async resolve(): Promise<SessionStatus> {
    const result = await apiResult(apiClient.users.me.get());

    if (result.isError()) {
      this.userStore.clear();
      return result.error.code === 'USER_NOT_FOUND' ? 'unregistered' : 'unauthenticated';
    }

    this.userStore.set(result.data);
    return 'registered';
  }
}
