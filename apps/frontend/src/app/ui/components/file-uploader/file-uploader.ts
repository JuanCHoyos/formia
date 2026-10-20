import { Component, forwardRef, inject, input, model, OnDestroy, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { APP_ICONS } from '../../constants/icons';
import { CommonModule } from '@angular/common';
import { FileDropZoneDirective } from '../../directives/file-drop-zone';
import type { AcceptedFileType } from '@/app/ui/types/accepted-file-type';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Button } from '../button/button';

interface UploadItem {
  id: number;
  file: File;
  previewUrl: string | null;
  loaded: number;
  status: 'queued' | 'uploading' | 'complete' | 'error';
}

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.html',
  imports: [
    CommonModule,
    DialogModule,
    Button,
    ProgressBarModule,
    NgIcon,
    FileDropZoneDirective,
    TranslatePipe,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploader),
      multi: true,
    },
    provideIcons(APP_ICONS),
  ],
})
export class FileUploader implements ControlValueAccessor, OnDestroy {
  private readonly translate = inject(TranslateService);

  multiple = input(true);
  accept = input<AcceptedFileType[]>(['image/*']);
  maxSizeMb = input(50);
  uploadUrl = input('');
  uploads = signal<UploadItem[]>([]);
  disabled = signal(false);
  errorMessage = signal('');
  dragActive = signal(false);

  showDialog = model(false);

  private nextId = 0;
  private onChange: (files: File[]) => void = () => { };
  private onTouched: () => void = () => { };

  writeValue(files: File[] | null): void {
    this.releasePreviews(this.uploads());
    this.uploads.set((files ?? []).map((file) => this.createUploadItem(file)));
  }

  ngOnDestroy(): void {
    this.releasePreviews(this.uploads());
  }

  registerOnChange(fn: (files: File[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  selectFiles(event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.addFiles(Array.from(inputElement.files ?? []));
    inputElement.value = '';
  }

  onFilesDropped(files: File[]): void {
    this.addFiles(files);
  }

  setDragActive(isActive: boolean): void {
    this.dragActive.set(isActive);
  }

  private addFiles(selectedFiles: File[]): void {
    const maxSizeBytes = this.maxSizeMb() * 1024 * 1024;
    const rejectedByType = selectedFiles.filter((file) => !this.isAccepted(file));
    const rejectedBySize = selectedFiles.filter((file) => file.size > maxSizeBytes);
    const acceptedFiles = selectedFiles.filter(
      (file) => this.isAccepted(file) && file.size <= maxSizeBytes,
    );

    const errors: string[] = [];
    if (rejectedByType.length) {
      errors.push(
        this.translate.instant('fileUploader.errors.allowedTypes', {
          types: this.getAcceptedTypesLabel(),
        }) as string,
      );
    }
    if (rejectedBySize.length) {
      errors.push(
        this.translate.instant('fileUploader.errors.maxFileSize', {
          size: this.formatBytes(maxSizeBytes),
        }) as string,
      );
    }
    this.errorMessage.set(errors.join(' '));

    if (acceptedFiles.length === 0) {
      return;
    }

    const files = this.multiple() ? acceptedFiles : acceptedFiles.slice(0, 1);
    const newUploads = files.map((file) => this.createUploadItem(file));

    if (this.multiple()) {
      this.uploads.update((uploads) => [...uploads, ...newUploads]);
    } else {
      this.releasePreviews(this.uploads());
      this.uploads.set(newUploads);
    }

    this.onChange(this.uploads().map((item) => item.file));
    this.onTouched();
  }

  removeFile(id: number): void {
    const removedUpload = this.uploads().find((item) => item.id === id);
    if (removedUpload?.previewUrl) URL.revokeObjectURL(removedUpload.previewUrl);

    const uploads = this.uploads().filter((item) => item.id !== id);
    this.uploads.set(uploads);
    this.onChange(uploads.map((item) => item.file));
    this.onTouched();
  }

  async uploadFiles() {
    const url = this.uploadUrl().trim();
    if (!url) {
      this.errorMessage.set(
        this.translate.instant('fileUploader.errors.missingUploadUrl') as string,
      );
      return;
    }

    this.errorMessage.set('');
    const queuedUploads = this.uploads().filter((item) => item.status === 'queued');

    for (const item of queuedUploads) {
      this.updateUpload(item.id, { status: 'uploading', loaded: 0 });
    }

    await Promise.all(queuedUploads.map((item) => this.uploadFile(item, url)));

    if (this.uploads().every((item) => item.status === 'complete')) {
      this.showDialog.set(false);
    }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;

    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const locale = this.translate.currentLang() ?? 'en';
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(size)} ${units[unitIndex]}`;
  }

  private createUploadItem(file: File): UploadItem {
    return {
      id: this.nextId++,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      loaded: 0,
      status: 'queued',
    };
  }

  private releasePreviews(uploads: UploadItem[]): void {
    for (const item of uploads) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
  }

  private isAccepted(file: File): boolean {
    const acceptedTypes = this.accept()
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean);

    if (acceptedTypes.length === 0) return true;

    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    return acceptedTypes.some((type) => {
      if (type.startsWith('.')) return fileName.endsWith(type);
      if (type.endsWith('/*')) return fileType.startsWith(type.slice(0, -1));
      return fileType === type;
    });
  }

  private getAcceptedTypesLabel(): string {
    return this.accept()
      .map((type) => type.trim())
      .filter(Boolean)
      .join(', ');
  }

  private updateUpload(id: number, changes: Partial<UploadItem>): void {
    this.uploads.update((uploads) =>
      uploads.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  private async uploadFile(item: UploadItem, url: string): Promise<void> {
    return new Promise((resolve) => {
      const request = new XMLHttpRequest();
      const body = new FormData();
      body.append('file', item.file);

      request.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable) return;
        const loaded = Math.min(
          item.file.size,
          Math.round((event.loaded / event.total) * item.file.size),
        );
        this.updateUpload(item.id, { loaded });
      });

      request.addEventListener('load', () => {
        if (request.status >= 200 && request.status < 300) {
          this.updateUpload(item.id, { loaded: item.file.size, status: 'complete' });
        } else {
          this.updateUpload(item.id, { status: 'error' });
          this.errorMessage.set(
            this.translate.instant('fileUploader.errors.httpFailure', {
              status: request.status,
            }) as string,
          );
        }
        resolve();
      });

      request.addEventListener('error', () => {
        this.updateUpload(item.id, { status: 'error' });
        this.errorMessage.set(
          this.translate.instant('fileUploader.errors.uploadFailure') as string,
        );
        resolve();
      });

      request.open('POST', url);
      request.send(body);
    });
  }
}
