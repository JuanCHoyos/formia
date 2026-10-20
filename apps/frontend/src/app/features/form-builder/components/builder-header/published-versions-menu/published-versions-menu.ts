import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { Button } from '@/app/ui/components/button/button';
import { MAX_PREVIOUS_FORM_VERSIONS } from '@formly/core/schemas/form';
import { FormBuilderSync } from '../../../services/form-builder-sync';

@Component({
  selector: 'app-published-versions-menu',
  templateUrl: './published-versions-menu.html',
  imports: [Button, DatePipe, PopoverModule, TranslatePipe],
})
export class PublishedVersionsMenu {
  private readonly sync = inject(FormBuilderSync);

  protected readonly maxPreviousVersions = MAX_PREVIOUS_FORM_VERSIONS;
  /** Previous versions only: the newest stored version is the one currently published. */
  protected readonly versions = computed(() => [...this.sync.publishedVersions()].reverse().slice(1));

  protected restore(version: Parameters<FormBuilderSync['restoreVersion']>[0]): void {
    this.sync.restoreVersion(version);
  }
}
