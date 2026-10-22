import type { AppIcon } from '@/app/ui/types/icons';
import type { FieldTypeName } from './config-types';

export const FIELD_TYPE_ICONS = {
  text: 'lucideType',
  textarea: 'lucideTextAlignStart',
  checkbox: 'lucideSquareCheck',
  'container-group': 'lucideSquare',
  date: 'lucideCalendarDays',
  select: 'lucideListChecks',
  radio: 'lucideCircleDot',
  multicheckbox: 'lucideListChecks',
  matrix: 'lucideTable',
  'radio-image': 'lucideImage',
  rating: 'lucideStar',
  heading: 'lucideType',
  paragraph: 'lucideTextAlignStart',
  image: 'lucideImage',
  alert: 'lucideAlertTriangle',
  divider: 'lucideSeparatorHorizontal',
} as const satisfies Record<FieldTypeName, AppIcon>;
