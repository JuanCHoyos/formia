import { Component, inject, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { BuilderDragState } from '@/app/features/form-builder/services/builder-drag-state';
import { APP_ICONS } from '@/app/ui/constants/icons';

@Component({
  selector: 'app-builder-workspace-empty-state',
  templateUrl: './builder-workspace-empty-state.html',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderWorkspaceEmptyState {
  readonly dragState = inject(BuilderDragState);
  readonly dragAndDropMessage = input<string>('formBuilder.workspace.dragFieldsHere');
}
