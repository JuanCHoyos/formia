import { inject, Service } from '@angular/core';

import { apiClient } from '../api/api-client';
import { apiResult } from '../api/api-result';
import { UserStore } from './user-store';

export type SessionStatus = 'registered' | 'unauthenticated' | 'unregistered';

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
