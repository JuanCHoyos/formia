import type { ButtonSeverity } from 'primeng/button';

import type { AppIcon } from '../../../ui/types/icons';

export type MenuActionItem = {
  label: string;
  icon: AppIcon;
  severity: ButtonSeverity;
  command: () => void;
  customClass: string;
};
