import { Component, inject } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { Button } from '@/app/ui/components/button/button';
import { SegmentedControl } from '@/app/ui/components/segmented-control/segmented-control';

import { BuilderDragState } from '../../../services/builder-drag-state';
import { BuilderMenuState } from '../../../services/builder-menu-state';
import { FormBuilderStore } from '../../../services/form-builder-store';
import { FormBuilderSync } from '../../../services/form-builder-sync';
import { CreatePageDialog } from './create-page-dialog/create-page-dialog';
import { FormTreeHistoryMenu } from './form-tree-history-menu/form-tree-history-menu';

@Component({
  selector: 'app-builder-workspace-header',
  templateUrl: './builder-workspace-header.html',
  imports: [Button, SegmentedControl, TranslatePipe, FormTreeHistoryMenu, CreatePageDialog],
})
export class BuilderWorkspaceHeader {
  readonly formBuilderStore = inject(FormBuilderStore);
  readonly menuState = inject(BuilderMenuState);
  readonly dragState = inject(BuilderDragState);
  protected readonly sync = inject(FormBuilderSync);
}
