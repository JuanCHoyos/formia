import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from '@ui/components/button/button';
import { FormSettingsPopover } from './form-settings-popover/form-settings-popover';
import { FormTitleEditor } from './form-title-editor/form-title-editor';
import { PublishedVersionsMenu } from './published-versions-menu/published-versions-menu';
import { BuilderPreviewState } from '../../services/builder-preview-state';
import { FormBuilderSync } from '../../services/form-builder-sync';

@Component({
  selector: 'app-builder-header',
  templateUrl: './builder-header.html',
  imports: [Button, FormSettingsPopover, FormTitleEditor, PublishedVersionsMenu, TranslatePipe],
})
export class BuilderHeader {
  private readonly router = inject(Router);

  protected readonly sync = inject(FormBuilderSync);
  readonly formPreviewState = inject(BuilderPreviewState);

  protected readonly saveStateKey = computed(() => `formBuilder.header.saveState.${this.sync.saveState()}`);

  protected goToForms(): void {
    void this.router.navigateByUrl('/dashboard/forms');
  }
}
