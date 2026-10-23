import type {
  FileRejection,
  FileRejectionReason,
  FileUploadRules,
  FileValidationResult,
} from '../types/file-upload';

export const BYTES_PER_MB = 1024 * 1024;

export function isAcceptedFile(file: File, accept: readonly string[]): boolean {
  const acceptedTypes = accept.map((type) => type.trim().toLowerCase()).filter(Boolean);
  if (acceptedTypes.length === 0) return true;

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return acceptedTypes.some((type) => {
    if (type.startsWith('.')) return fileName.endsWith(type);
    if (type.endsWith('/*')) return fileType.startsWith(type.slice(0, -1));
    return fileType === type;
  });
}

export function isSameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

export function totalFileSize(files: readonly File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/** Adds `incoming` to `current` in order, rejecting each file that breaks a rule. */
export function validateFiles(
  current: readonly File[],
  incoming: readonly File[],
  rules: FileUploadRules,
): FileValidationResult {
  const accepted = [...current];
  const rejections: FileRejection[] = [];

  for (const file of incoming) {
    const reason = getRejectionReason(file, accepted, rules);
    if (reason) {
      rejections.push({ file, reason });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejections };
}

export function formatBytes(bytes: number, locale: string): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(size)} ${units[unitIndex]}`;
}

/** Short label for an extension or MIME type: `.pdf` → `PDF`, `image/svg+xml` → `SVG`. */
export function getFileTypeLabel(type: string): string {
  if (type.startsWith('.')) return type.slice(1).toUpperCase();

  const subtype = type.split('/')[1]?.split('+')[0] ?? type;
  return subtype === 'plain' ? 'TXT' : subtype.toUpperCase();
}

function getRejectionReason(
  file: File,
  accepted: readonly File[],
  rules: FileUploadRules,
): FileRejectionReason | null {
  if (!isAcceptedFile(file, rules.accept)) return 'type';
  if (file.size > rules.maxFileSizeBytes) return 'fileSize';
  if (accepted.some((acceptedFile) => isSameFile(acceptedFile, file))) return 'duplicate';
  if (accepted.length >= rules.maxFiles) return 'count';
  if (
    rules.maxTotalSizeBytes !== undefined &&
    totalFileSize(accepted) + file.size > rules.maxTotalSizeBytes
  ) {
    return 'totalSize';
  }
  return null;
}
