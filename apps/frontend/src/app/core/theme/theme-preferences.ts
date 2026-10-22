import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, Service, signal } from '@angular/core';

import { usePreset } from '@primeuix/themes';

import { PrimeNG } from 'primeng/config';
import { z } from 'zod';

import { BRAND_NAMES, BRANDS, DEFAULT_BRAND } from './brand';
import { buildPreset, PLIEGO_THEME_OPTIONS } from './pliego-preset';
import type { BrandName } from './types/brand';
import type { ThemeMode } from './types/theme-mode';
import type { TransitionOrigin } from './types/transition-origin';
import { revealTransition } from './view-transition';

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

const STORAGE_KEY = 'pliego.appearance';
const DARK_CLASS = 'app-dark';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const StoredAppearanceSchema = z.object({
  mode: z.enum(['dark', 'light', 'system']).catch('system'),
  brand: z.enum(BRAND_NAMES).catch(DEFAULT_BRAND),
});

type StoredAppearance = z.infer<typeof StoredAppearanceSchema>;

@Service()
export class ThemePreferences {
  private readonly document = inject(DOCUMENT);
  private readonly primeng = inject(PrimeNG);

  private readonly _mode = signal<ThemeMode>('system');
  private readonly _brand = signal<BrandName>(DEFAULT_BRAND);
  private readonly systemPrefersDark = signal(false);

  readonly mode = this._mode.asReadonly();
  readonly brand = this._brand.asReadonly();
  readonly isDark = computed(
    () => this._mode() === 'dark' || (this._mode() === 'system' && this.systemPrefersDark()),
  );

  constructor() {
    const mediaQuery = this.document.defaultView?.matchMedia(DARK_SCHEME_QUERY);
    if (!mediaQuery) {
      return;
    }

    const onChange = (event: MediaQueryListEvent) => {
      this.systemPrefersDark.set(event.matches);
      this.applyScheme();
    };

    this.systemPrefersDark.set(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => mediaQuery.removeEventListener('change', onChange));
  }

  restore(): void {
    const { mode, brand } = this.read();

    this._mode.set(mode);
    this._brand.set(brand);
    this.applyScheme();

    if (brand !== DEFAULT_BRAND) {
      this.primeng.theme.set({ preset: buildPreset(BRANDS[brand]), options: PLIEGO_THEME_OPTIONS });
    }
  }

  setMode(mode: ThemeMode, origin?: TransitionOrigin): void {
    if (mode === this._mode()) {
      return;
    }

    const wasDark = this.isDark();
    this._mode.set(mode);
    this.persist();

    if (wasDark === this.isDark()) {
      return;
    }

    revealTransition(this.document, () => this.applyScheme(), origin);
  }

  setBrand(brand: BrandName, origin?: TransitionOrigin): void {
    if (brand === this._brand()) {
      return;
    }

    this._brand.set(brand);
    this.persist();
    revealTransition(this.document, () => usePreset(buildPreset(BRANDS[brand])), origin);
  }

  private applyScheme(): void {
    this.document.documentElement.classList.toggle(DARK_CLASS, this.isDark());
  }

  private read(): StoredAppearance {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return StoredAppearanceSchema.parse(raw ? JSON.parse(raw) : {});
    } catch {
      return StoredAppearanceSchema.parse({});
    }
  }

  private persist(): void {
    const appearance: StoredAppearance = { mode: this._mode(), brand: this._brand() };

    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      return;
    }
  }
}
