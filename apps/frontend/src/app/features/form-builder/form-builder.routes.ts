import { Routes } from '@angular/router';

export const FORM_BUILDER_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./pages/builder-page/builder-page').then((m) => m.BuilderPage),
  },
];
