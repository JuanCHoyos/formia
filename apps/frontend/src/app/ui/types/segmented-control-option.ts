import type { AppIcon } from './icons';

export interface SegmentedControlOption<T> {
  value: T;
  labelKey: string;
  icon?: AppIcon;
}
