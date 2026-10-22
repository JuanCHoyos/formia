import { DOCUMENT } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';

import { provideFormlyCore } from '@ngx-formly/core';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { provideGlobalSortableOptions } from 'nxt-sortablejs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { apiErrorInterceptor } from './core/interceptors/api-error-interceptor';
import { PLIEGO_THEME_OPTIONS, PliegoPreset } from './core/theme/pliego-preset';
import { ThemePreferences } from './core/theme/theme-preferences';
import { fieldTypeConfigurations } from './features/form-builder/formly/config/config-types';
import { fieldWrapperConfigurations } from './features/form-builder/formly/config/config-wrappers';

const DEFAULT_LANGUAGE = 'en';

const getBrowserLanguage = (): string => {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const preferredLanguage = [...navigator.languages, navigator.language].find((language) =>
    /^(en|es)(-|$)/i.test(language),
  );

  return preferredLanguage?.toLowerCase().startsWith('es') ? 'es' : DEFAULT_LANGUAGE;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    providePrimeNG({
      ripple: true,
      license:
        'eyJpZCI6ImE0N2YzNzhiLTNkMzUtNDVmNS1hNzU5LTljZDBlNzAxYmMyZSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTAxMzk2OTAsImV4cCI6MTgyMTY3NTY5MH0.wtj3bFgxZBMdBtHGiN_k30l45Yd0z_flr42MTlXr5bO3RJ2pw1KX2dm3_4E-VgEQ_kxscdIrS4gIaI3NtRtDCA',
      theme: {
        preset: PliegoPreset,
        options: PLIEGO_THEME_OPTIONS,
      },
    }),
    provideAppInitializer(() => inject(ThemePreferences).restore()),
    provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
    provideTranslateService({
      fallbackLang: DEFAULT_LANGUAGE,
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
    provideAppInitializer(() => {
      const language = getBrowserLanguage();
      inject(DOCUMENT).documentElement.lang = language;
      return inject(TranslateService).use(language);
    }),
    provideSignalFormsConfig({
      classes: { 'field-untouched': (field) => !field.state().touched() },
    }),
    provideFormlyCore({
      types: fieldTypeConfigurations,
      wrappers: fieldWrapperConfigurations,
    }),
    provideGlobalSortableOptions({
      animation: 150,
    }),
    MessageService,
    ConfirmationService,
  ],
};
