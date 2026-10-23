import { Component, inject } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { ProgressBarModule } from 'primeng/progressbar';

import { Button } from '@/app/ui/components/button/button';

import { FormBuilderStore } from '../../../services/form-builder-store';

@Component({
  selector: 'app-builder-workspace-footer',
  templateUrl: './builder-workspace-footer.html',
  imports: [Button, ProgressBarModule, TranslatePipe],
})
export class BuilderWorkspaceFooter {
  readonly formBuilderStore = inject(FormBuilderStore);

  updateFormPage(step: -1 | 1) {
    this.formBuilderStore.currentFormPage.update((value) => value + step);
  }
}
