import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Session } from '../session';

/** Keeps users with a valid session out of the auth pages. */
export const unauthenticatedGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const session = inject(Session);
  const status = await session.resolve();
  switch (status) {
    case 'registered':
      return router.createUrlTree(['/dashboard/forms']);
    case 'unregistered':
      return router.createUrlTree(['/complete-register']);
    default:
      return true;
  }
};
