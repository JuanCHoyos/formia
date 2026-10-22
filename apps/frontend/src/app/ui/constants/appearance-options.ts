import { BRAND_NAMES, BRANDS } from '@/app/core/theme/brand';
import { THEME_MODES } from '@/app/core/theme/theme-preferences';

import type { ThemeMode } from '../../core/theme/types/theme-mode';
import type { BrandOption } from '../types/brand-option';
import type { AppIcon } from '../types/icons';
import type { SegmentedControlOption } from '../types/segmented-control-option';

const THEME_MODE_ICONS: Record<ThemeMode, AppIcon> = {
  light: 'lucideSun',
  dark: 'lucideMoon',
  system: 'lucideLaptop',
};

export const THEME_MODE_OPTIONS: readonly SegmentedControlOption<ThemeMode>[] = THEME_MODES.map(
  (mode) => ({
    value: mode,
    icon: THEME_MODE_ICONS[mode],
    labelKey: `appearance.mode.${mode}`,
  }),
);

export const BRAND_OPTIONS: readonly BrandOption[] = BRAND_NAMES.map((brand) => ({
  brand,
  labelKey: `appearance.brand.${brand}`,
  swatch: BRANDS[brand].light.color,
}));
