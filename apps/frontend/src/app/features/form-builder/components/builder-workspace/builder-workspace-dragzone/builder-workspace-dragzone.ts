import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilderStore } from '../../../services/form-builder-store';
import { BuilderWorkspaceFormPage } from './builder-workspace-form-page/builder-workspace-form-page';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-builder-workspace-dragzone',
  templateUrl: './builder-workspace-dragzone.html',
  imports: [CommonModule, BuilderWorkspaceFormPage, TranslatePipe],
})
export class BuilderWorkspaceDragzone {
  readonly formBuilderStore = inject(FormBuilderStore);
}
