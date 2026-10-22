import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Session } from '../session';

/** Only lets authenticated users that don't exist in the database yet through. */
export const unregisteredGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const session = inject(Session);
  const status = await session.resolve();

  switch (status) {
    case 'unregistered':
      return true;
    case 'registered':
      return router.createUrlTree(['/dashboard/forms']);
    default:
      return router.createUrlTree(['/auth/login']);
  }
};
