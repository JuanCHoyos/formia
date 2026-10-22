import { Service } from '@angular/core';

import type { UpdateUserProfileInput, UserProfile } from '@formly/core/schemas/user';

import { apiClient } from '../api/api-client';
import { apiResult } from '../api/api-result';

@Service()
export class UsersApi {
  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    const result = await apiResult(apiClient.users.me.patch(input));

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
}
