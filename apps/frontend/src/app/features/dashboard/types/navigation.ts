import type { AppIcon } from '../../../ui/types/icons';

export interface NavItem {
  labelKey: string;
  icon: AppIcon;
  route?: string;
}

export interface NavGroup {
  labelKey: string;
  items: readonly NavItem[];
}

export interface UserMenuLink {
  labelKey: string;
  icon: AppIcon;
  route: string;
}
