import { inject, Service } from '@angular/core';

import { TranslateService, type InterpolationParameters } from '@ngx-translate/core';

import { ConfirmationService, MessageService, type Confirmation } from 'primeng/api';

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

@Service()
export class Notifications {
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  success(summaryKey: string, detailKey: string, options?: NotificationOptions): void {
    this.show('success', summaryKey, detailKey, options);
  }

  info(summaryKey: string, detailKey: string, options?: NotificationOptions): void {
    this.show('info', summaryKey, detailKey, options);
  }

  warn(summaryKey: string, detailKey: string, options?: NotificationOptions): void {
    this.show('warn', summaryKey, detailKey, options);
  }

  error(summaryKey: string, detailKey: string, options?: NotificationOptions): void {
    this.show('error', summaryKey, detailKey, options);
  }

  confirmDestructive(options: ConfirmationOptions): void {
    this.showConfirmation(options, 'common.actions.delete', 'danger');
  }

  confirm(options: ConfirmationOptions): void {
    this.showConfirmation(options, 'common.actions.accept', 'primary');
  }

  private showConfirmation(
    options: ConfirmationOptions,
    defaultAcceptLabelKey: string,
    acceptSeverity: 'danger' | 'primary',
  ): void {
    const cancelLabelKey = options.cancelLabelKey ?? 'common.actions.cancel';
    const acceptLabelKey = options.acceptLabelKey ?? defaultAcceptLabelKey;
    const confirmation: Confirmation = {
      key: options.key,
      header: this.translate.instant(options.titleKey, options.titleParams) as string,
      message: this.translate.instant(options.messageKey, options.messageParams) as string,
      icon: options.icon,
      closeOnEscape: options.closeOnEscape ?? true,
      rejectLabel: this.translate.instant(cancelLabelKey, options.cancelLabelParams) as string,
      rejectButtonProps: {
        label: this.translate.instant(cancelLabelKey, options.cancelLabelParams) as string,
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.translate.instant(acceptLabelKey, options.acceptLabelParams) as string,
        severity: acceptSeverity,
      },
      accept: options.accept,
      reject: options.reject,
    };

    this.confirmationService.confirm(confirmation);
  }

  private show(
    severity: NotificationSeverity,
    summaryKey: string,
    detailKey: string,
    options: NotificationOptions = {},
  ): void {
    this.messageService.add({
      severity,
      key: options.key ?? 'top-center',
      life: options.life ?? 10_000,
      summary: this.translate.instant(summaryKey, options.summaryParams) as string,
      detail: this.translate.instant(detailKey, options.detailParams) as string,
    });
  }
}
