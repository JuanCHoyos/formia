import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Session } from '../session';

export const authenticatedGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const session = inject(Session);
  const status = await session.resolve();

  switch (status) {
    case 'registered':
      return true;
    case 'unregistered':
      return router.createUrlTree(['/complete-register']);
    default:
      return router.createUrlTree(['/auth/login']);
  }
};
