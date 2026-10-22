import { Component, computed, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertOctagon,
  lucideAlertTriangle,
  lucideCheckCircle2,
  lucideInfo,
} from '@ng-icons/lucide';
import { FieldType } from '@ngx-formly/core';

import { MessageModule } from 'primeng/message';
import { MessageSeverity } from 'primeng/types/message';

import type { AlertFieldTypeConfig } from '../../interfaces/field-types/alert-field';

@Component({
  selector: 'formly-field-alert',
  templateUrl: './alert-field.type.html',
  imports: [MessageModule, NgIcon],
  providers: [
    provideIcons({ lucideInfo, lucideAlertTriangle, lucideCheckCircle2, lucideAlertOctagon }),
  ],
})
export class AlertFieldType extends FieldType<AlertFieldTypeConfig> {
  icons = signal<Record<Exclude<MessageSeverity, 'contrast' | 'secondary'>, string>>({
    info: 'lucideInfo',
    error: 'lucideAlertOctagon',
    success: 'lucideCheckCircle2',
    warn: 'lucideAlertTriangle',
  });

  currentIcon = computed<string>(() => {
    return this.icons()[this.props.severity];
  });
}
