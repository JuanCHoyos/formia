import { CanDeactivateFn, Routes } from '@angular/router';

import type { BuilderPage } from './pages/builder-page/builder-page';

const confirmLeaveBuilder: CanDeactivateFn<BuilderPage> = (page) => page.canLeave();

export const FORM_BUILDER_ROUTES: Routes = [
  {
    path: ':id',
    canDeactivate: [confirmLeaveBuilder],
    loadComponent: () => import('./pages/builder-page/builder-page').then((m) => m.BuilderPage),
  },
];
