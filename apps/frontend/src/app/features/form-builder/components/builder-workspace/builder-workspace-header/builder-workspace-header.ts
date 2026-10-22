import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { SelectButtonModule } from 'primeng/selectbutton';

import { Button } from '@/app/ui/components/button/button';
import { APP_ICONS } from '@/app/ui/constants/icons';

import { BuilderMenuState } from '../../../services/builder-menu-state';
import { FormBuilderStore } from '../../../services/form-builder-store';
import { FormBuilderSync } from '../../../services/form-builder-sync';
import { CreatePageDialog } from './create-page-dialog/create-page-dialog';
import { FormTreeHistoryMenu } from './form-tree-history-menu/form-tree-history-menu';

@Component({
  selector: 'app-builder-workspace-header',
  templateUrl: './builder-workspace-header.html',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    NgIcon,
    SelectButtonModule,
    TranslatePipe,
    FormTreeHistoryMenu,
    CreatePageDialog,
  ],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderWorkspaceHeader {
  readonly formBuilderStore = inject(FormBuilderStore);
  readonly menuState = inject(BuilderMenuState);
  protected readonly sync = inject(FormBuilderSync);
}
