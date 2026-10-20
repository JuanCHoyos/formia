import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

export const authenticatedGuard: CanActivateFn = async () => {
    const router = inject(Router);

    switch (await inject(Session).resolve()) {
        case 'registered':
            return true;
        case 'unregistered':
            return router.createUrlTree(['/complete-register']);
        default:
            return router.createUrlTree(['/auth/login']);
    }
};
