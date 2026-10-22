import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/settings-layout').then((m) => m.SettingsLayout),
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-settings/profile-settings').then((m) => m.ProfileSettings),
      },
      {
        path: 'appearance',
        loadComponent: () =>
          import('./pages/appearance-settings/appearance-settings').then(
            (m) => m.AppearanceSettings,
          ),
      },
    ],
  },
];
