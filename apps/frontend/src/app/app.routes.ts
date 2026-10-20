import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { authenticatedGuard } from '@core/auth/authenticated';
import { unauthenticatedGuard } from '@core/auth/unauthenticated';
import { unregisteredGuard } from '@core/auth/unregistered';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/layout/auth-layout').then((m) => m.AuthLayout),
    children: AUTH_ROUTES,
    canActivate: [unauthenticatedGuard],
  },
  {
    path: 'complete-register',
    canActivate: [unregisteredGuard],
    loadComponent: () =>
      import('./features/auth/pages/complete-register/complete-register').then(
        (m) => m.CompleteRegister,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./features/dashboard/layout/dashboard-layout/dashboard-layout').then(
        (m) => m.DashboardLayout,
      ),
    children: [
      {
        path: 'forms',
        loadComponent: () =>
          import('./features/dashboard/pages/forms/forms').then((m) => m.Forms),
      },
    ],
  },
  {
    path: 'form/builder',
    canActivate: [authenticatedGuard],
    loadChildren: () =>
      import('./features/form-builder/form-builder.routes').then((m) => m.FORM_BUILDER_ROUTES),
  },
  {
    path: '',
    redirectTo: 'forms',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'forms',
  },
];
