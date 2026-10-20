import type { AppIcon } from './icons';

export interface OptionCardSelectorOption<T = string> {
  icon: AppIcon;
  label: string;
  description: string;
  value: T;
}
