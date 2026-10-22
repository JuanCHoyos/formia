import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tag } from 'primeng/tag';
import { Button } from '@ui/components/button/button';
import { APP_ICONS } from '@ui/constants/icons';
import { FormBuilderSync } from '../../../services/form-builder-sync';

@Component({
  selector: 'app-save-status',
  imports: [ProgressSpinner, Tag, NgIcon, TranslatePipe, Button],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './save-status.html',
})
export class SaveStatus {
  private readonly sync = inject(FormBuilderSync);

  protected readonly state = this.sync.saveState;

  protected retry(): void {
    void this.sync.saveDraft();
  }
}
