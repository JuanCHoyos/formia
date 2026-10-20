import { Button } from '@/app/ui/components/button/button';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilderStore } from '../../../services/form-builder-store';
import { ProgressBarModule } from 'primeng/progressbar';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-builder-workspace-footer',
  templateUrl: './builder-workspace-footer.html',
  imports: [CommonModule, Button, ProgressBarModule, TranslatePipe],
})
export class BuilderWorkspaceFooter {
  readonly formBuilderStore = inject(FormBuilderStore);

  updateFormPage(step: -1 | 1) {
    this.formBuilderStore.currentFormPage.update((value) => value + step);
  }
}
