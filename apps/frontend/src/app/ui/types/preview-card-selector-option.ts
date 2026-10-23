import type { AppIcon } from './icons';

export interface PreviewCardSelectorOption<T = string> {
  label: string;
  value: T;
  icon?: AppIcon;
}

export interface PreviewCardSelectorContext<O> {
  $implicit: O;
}
