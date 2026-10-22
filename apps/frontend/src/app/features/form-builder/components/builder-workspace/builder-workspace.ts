import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, inject } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { BuilderPreviewState } from '../../services/builder-preview-state';
import { FormBuilderStore } from '../../services/form-builder-store';
import { BuilderWorkspaceDragzone } from './builder-workspace-dragzone/builder-workspace-dragzone';
import { BuilderWorkspaceFooter } from './builder-workspace-footer/builder-workspace-footer';
import { BuilderWorkspaceHeader } from './builder-workspace-header/builder-workspace-header';
import { BuilderWorkspacePreview } from './builder-workspace-preview/builder-workspace-preview';

@Component({
  selector: 'app-builder-workspace',
  templateUrl: './builder-workspace.html',
  imports: [
    BuilderWorkspaceHeader,
    BuilderWorkspaceDragzone,
    BuilderWorkspaceFooter,
    BuilderWorkspacePreview,
    TranslatePipe,
    CdkScrollable,
  ],
})
export class BuilderWorkspace {
  readonly formBuilderStore = inject(FormBuilderStore);
  readonly builderPreviewState = inject(BuilderPreviewState);
}
