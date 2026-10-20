import { Component, inject, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Button } from '@/app/ui/components/button/button';
import { FormBuilderStore } from '@/app/features/form-builder/services/form-builder-store';
import { FieldConfigFactory } from '@/app/features/form-builder/services/field-config-factory';
import { FormPageContainer } from '@/app/features/form-builder/formly/interfaces/app-formly-field-config';

@Component({
  selector: 'app-create-page-dialog',
  templateUrl: './create-page-dialog.html',
  imports: [Button, DialogModule, InputTextModule, TranslatePipe],
})
export class CreatePageDialog {
  readonly formBuilderStore = inject(FormBuilderStore);
  readonly fieldConfigFactory = inject(FieldConfigFactory);
  readonly showDialog = signal(false);
  readonly pageName = signal('');

  openDialog(): void {
    this.pageName.set('');
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.pageName.set('');
  }

  updatePageName(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.pageName.set(event.target.value);
    }
  }

  savePage(event: Event): void {
    event.preventDefault();
    const pageName = this.pageName().trim();
    if (!pageName) return;

    const formPageContainer = this.fieldConfigFactory.createFormPageContainer(pageName);
    this.formBuilderStore.addPage(formPageContainer);
    this.closeDialog();
  }
}
