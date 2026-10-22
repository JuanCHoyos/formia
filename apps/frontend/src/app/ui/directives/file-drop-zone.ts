import { Directive, input, output } from '@angular/core';

@Directive({
  selector: '[appFileDropZone]',
  host: {
    '(dragenter)': 'handleDragEnter($event)',
    '(dragover)': 'handleDragOver($event)',
    '(dragleave)': 'handleDragLeave($event)',
    '(drop)': 'handleDrop($event)',
  },
})
export class FileDropZoneDirective {
  fileDropDisabled = input(false);
  filesDropped = output<File[]>();
  dragActiveChange = output<boolean>();

  private dragDepth = 0;
  private isActive = false;

  handleDragEnter(event: DragEvent): void {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    if (this.fileDropDisabled()) return;

    this.dragDepth++;
    this.setActive(true);
  }

  handleDragOver(event: DragEvent): void {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.fileDropDisabled() ? 'none' : 'copy';
    }
  }

  handleDragLeave(event: DragEvent): void {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.setActive(false);
  }

  handleDrop(event: DragEvent): void {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    this.dragDepth = 0;
    this.setActive(false);

    if (this.fileDropDisabled()) return;
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) this.filesDropped.emit(files);
  }

  private hasFiles(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files');
  }

  private setActive(isActive: boolean): void {
    if (this.isActive === isActive) return;
    this.isActive = isActive;
    this.dragActiveChange.emit(isActive);
  }
}
