import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

/** Only lets authenticated users that don't exist in the database yet through. */
export const unregisteredGuard: CanActivateFn = async () => {
    const router = inject(Router);

    switch (await inject(Session).resolve()) {
        case 'unregistered':
            return true;
        case 'registered':
            return router.createUrlTree(['/dashboard/forms']);
        default:
            return router.createUrlTree(['/auth/login']);
    }
};
