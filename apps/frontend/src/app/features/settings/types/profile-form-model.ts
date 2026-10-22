import type { UserRole } from '@formly/core/schemas/common';

export interface ProfileFormModel {
  fullName: string;
  roles: UserRole[];
}
