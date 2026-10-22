import type { InterpolationParameters } from '@ngx-translate/core';

export type NotificationSeverity = 'error' | 'info' | 'success' | 'warn';

export interface NotificationOptions {
  key?: string;
  life?: number;
  summaryParams?: InterpolationParameters;
  detailParams?: InterpolationParameters;
}

export interface ConfirmationOptions {
  titleKey: string;
  messageKey: string;
  accept?: () => void;
  reject?: () => void;
  key?: string;
  icon?: string;
  acceptLabelKey?: string;
  cancelLabelKey?: string;
  titleParams?: InterpolationParameters;
  messageParams?: InterpolationParameters;
  acceptLabelParams?: InterpolationParameters;
  cancelLabelParams?: InterpolationParameters;
  closeOnEscape?: boolean;
}
