import { APP_ICONS } from '@/app/ui/constants/icons';
import { DragDropZoneDirective } from '@/app/ui/directives/drag-drop-zone';
import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-builder-workspace-empty-state',
  templateUrl: './builder-workspace-empty-state.html',
  imports: [DragDropZoneDirective, NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderWorkspaceEmptyState {
  dragAndDropMessage = input<string>('formBuilder.workspace.dragFieldsHere');
}
