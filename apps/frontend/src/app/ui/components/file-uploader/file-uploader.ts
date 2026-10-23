import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DialogModule } from 'primeng/dialog';

import type { AcceptedFileType } from '@/app/ui/types/accepted-file-type';

import { APP_ICONS } from '../../constants/icons';
import { FileDropZoneDirective } from '../../directives/file-drop-zone';
import type { FileRejection, FileUploaderVariant, UploadedFile } from '../../types/file-upload';
import {
  BYTES_PER_MB,
  formatBytes,
  getFileTypeLabel,
  totalFileSize,
  validateFiles,
} from '../../utils/file.utils';
import { Button } from '../button/button';

interface QueuedFile {
  file: File;
  previewUrl: string | null;
}

let nextId = 0;

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.html',
  imports: [DialogModule, NgTemplateOutlet, Button, NgIcon, FileDropZoneDirective, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
})
export class FileUploader implements OnDestroy {
  private readonly translate = inject(TranslateService);

  readonly variant = input<FileUploaderVariant>('dialog');
  readonly header = input<string>();
  readonly accept = input<readonly AcceptedFileType[]>(['image/*']);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly maxFiles = input<number>();
  readonly maxFileSizeMb = input(5);
  readonly maxTotalSizeMb = input<number>();
  readonly history = input<readonly UploadedFile[]>([]);
  /** Hides the built-in button so the host can open the dialog with its own via `open()`. */
  readonly hideTrigger = input(false, { transform: booleanAttribute });

  /** Emits the selected files: on "Done" in the dialog, on every change in the minimal variant. */
  readonly filesSelected = output<File[]>();

  protected readonly id = `file-uploader-${nextId++}`;
  protected readonly dragActive = signal(false);
  protected readonly visible = signal(false);
  protected readonly rejections = signal<FileRejection[]>([]);
  protected readonly files = signal<File[]>([]);

  private readonly previewUrls = new Map<File, string>();

  protected readonly fileLimit = computed<number | undefined>(() =>
    this.multiple() ? this.maxFiles() : 1,
  );
  protected readonly maxFileSizeBytes = computed(() => this.maxFileSizeMb() * BYTES_PER_MB);
  protected readonly maxTotalSizeBytes = computed<number | undefined>(() => {
    const maxTotalSizeMb = this.maxTotalSizeMb();
    return maxTotalSizeMb === undefined ? undefined : maxTotalSizeMb * BYTES_PER_MB;
  });
  protected readonly totalSize = computed(() => totalFileSize(this.files()));

  protected readonly queue = computed<QueuedFile[]>(() =>
    this.files().map((file) => ({ file, previewUrl: this.previewUrlFor(file) })),
  );

  protected readonly acceptedTypesLabel = computed<string>(() => {
    this.translate.currentLang();
    const labels = this.accept().map((type) =>
      type.endsWith('/*')
        ? (this.translate.instant(`fileUploader.types.${type.slice(0, -2)}`) as string)
        : getFileTypeLabel(type),
    );
    return [...new Set(labels)].join(', ');
  });

  protected readonly limitsSummary = computed<string>(() => {
    this.translate.currentLang();
    const fileLimit = this.fileLimit();
    const maxTotalSizeBytes = this.maxTotalSizeBytes();
    const countKey =
      fileLimit === 1
        ? 'fileUploader.limits.single'
        : fileLimit === undefined
          ? 'fileUploader.limits.unlimited'
          : 'fileUploader.limits.count';

    const limits = [
      this.translate.instant(countKey, { count: fileLimit }) as string,
      this.translate.instant('fileUploader.limits.fileSize', {
        size: this.formatBytes(this.maxFileSizeBytes()),
      }) as string,
    ];
    if (maxTotalSizeBytes !== undefined) {
      limits.push(
        this.translate.instant('fileUploader.limits.totalSize', {
          size: this.formatBytes(maxTotalSizeBytes),
        }) as string,
      );
    }
    return limits.join(' · ');
  });

  constructor() {
    effect(() => {
      const files = new Set(this.files());
      for (const [file, url] of this.previewUrls) {
        if (files.has(file)) continue;
        URL.revokeObjectURL(url);
        this.previewUrls.delete(file);
      }
    });
  }

  ngOnDestroy(): void {
    for (const url of this.previewUrls.values()) URL.revokeObjectURL(url);
    this.previewUrls.clear();
  }

  protected selectFiles(event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) return;

    this.addFiles(Array.from(inputElement.files ?? []));
    inputElement.value = '';
  }

  protected addFiles(files: File[]): void {
    const multiple = this.multiple();
    const current = multiple ? this.files() : [];
    const { accepted, rejections } = validateFiles(current, files, {
      accept: this.accept(),
      maxFiles: this.fileLimit() ?? Number.POSITIVE_INFINITY,
      maxFileSizeBytes: this.maxFileSizeBytes(),
      maxTotalSizeBytes: this.maxTotalSizeBytes(),
    });

    this.rejections.set(rejections);
    if (accepted.length > current.length) this.setFiles(accepted);
  }

  protected removeFile(file: File): void {
    this.setFiles(this.files().filter((queuedFile) => queuedFile !== file));
  }

  open(): void {
    this.visible.set(true);
  }

  protected confirmSelection(): void {
    this.filesSelected.emit(this.files());
    this.close();
  }

  protected close(): void {
    this.rejections.set([]);
    this.files.set([]);
    this.visible.set(false);
  }

  protected rejectionMessage({ file, reason }: FileRejection): string {
    return this.translate.instant(`fileUploader.rejections.${reason}`, {
      name: file.name,
      count: this.fileLimit(),
      size: this.formatBytes(
        reason === 'totalSize' ? (this.maxTotalSizeBytes() ?? 0) : this.maxFileSizeBytes(),
      ),
    }) as string;
  }

  protected formatBytes(bytes: number): string {
    return formatBytes(bytes, this.currentLocale());
  }

  protected formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(this.currentLocale(), { dateStyle: 'medium' }).format(date);
  }

  protected isImage(type: string | undefined): boolean {
    return type?.startsWith('image/') ?? false;
  }

  private setFiles(files: File[]): void {
    this.files.set(files);
    if (this.variant() === 'minimal') this.filesSelected.emit(files);
  }

  private currentLocale(): string {
    return this.translate.currentLang() ?? 'en';
  }

  private previewUrlFor(file: File): string | null {
    if (!this.isImage(file.type)) return null;

    let url = this.previewUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.previewUrls.set(file, url);
    }
    return url;
  }
}
