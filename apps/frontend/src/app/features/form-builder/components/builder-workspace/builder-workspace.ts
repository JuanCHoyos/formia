import { Component, inject, input } from '@angular/core';
import { BuilderWorkspaceDragzone } from './builder-workspace-dragzone/builder-workspace-dragzone';
import { BuilderWorkspaceFooter } from './builder-workspace-footer/builder-workspace-footer';
import { BuilderWorkspaceHeader } from './builder-workspace-header/builder-workspace-header';
import { FormBuilderStore } from '../../services/form-builder-store';
import { TranslatePipe } from '@ngx-translate/core';
import { BuilderWorkspacePreview } from './builder-workspace-preview/builder-workspace-preview';
import { BuilderPreviewState } from '../../services/builder-preview-state';
import { CdkScrollable } from '@angular/cdk/scrolling';

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
