import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { provideFormlyCore } from '@ngx-formly/core';
import { fieldTypeConfigurations } from './features/form-builder/formly/config/config-types';
import { fieldWrapperConfigurations } from './features/form-builder/formly/config/config-wrappers';
import { provideGlobalSortableOptions } from 'nxt-sortablejs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { apiErrorInterceptor } from './core/interceptors/api-error-interceptor';

const DEFAULT_LANGUAGE = 'en';

function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const preferredLanguage = [...navigator.languages, navigator.language].find((language) =>
    /^(en|es)(-|$)/i.test(language),
  );

  return preferredLanguage?.toLowerCase().startsWith('es') ? 'es' : DEFAULT_LANGUAGE;
}

const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef0ff',
      100: '#dfe2ff',
      200: '#c5c8ff',
      300: '#a5a7ff',
      400: '#7d78f4',
      500: '#5146e5',
      600: '#4638d1',
      700: '#392bb5',
      800: '#30258f',
      900: '#2b2470',
      950: '#1d194d',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    providePrimeNG({
      ripple: true,
      license:
        'eyJpZCI6ImE0N2YzNzhiLTNkMzUtNDVmNS1hNzU5LTljZDBlNzAxYmMyZSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTAxMzk2OTAsImV4cCI6MTgyMTY3NTY5MH0.wtj3bFgxZBMdBtHGiN_k30l45Yd0z_flr42MTlXr5bO3RJ2pw1KX2dm3_4E-VgEQ_kxscdIrS4gIaI3NtRtDCA',
      theme: {
        preset: AppPreset,
        options: {
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
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
