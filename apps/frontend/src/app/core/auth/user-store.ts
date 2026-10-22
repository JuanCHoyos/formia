import { computed, Service, signal } from '@angular/core';
import type { UserProfile } from '@formly/core/schemas/user';

@Service()
export class UserStore {
  private readonly _user = signal<UserProfile | null>(null);

  readonly user = this._user.asReadonly();

  readonly initials = computed(() => {
    const name = this._user()?.fullName.trim();
    if (!name) {
      return '';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });
 
  set(user: UserProfile): void {
    this._user.set(user);
  }
 
  clear(): void {
    this._user.set(null);
  }
}
