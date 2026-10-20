import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

/** Keeps users with a valid session out of the auth pages. */
export const unauthenticatedGuard: CanActivateFn = async () => {
    const router = inject(Router);

    switch (await inject(Session).resolve()) {
        case 'registered':
            return router.createUrlTree(['/dashboard/forms']);
        case 'unregistered':
            return router.createUrlTree(['/complete-register']);
        default:
            return true;
    }
};
