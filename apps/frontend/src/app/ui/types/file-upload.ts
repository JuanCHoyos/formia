import type { AcceptedFileType } from './accepted-file-type';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type?: string;
  url?: string;
  uploadedAt?: string;
}

export type FileRejectionReason = 'count' | 'duplicate' | 'fileSize' | 'totalSize' | 'type';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export interface FileUploadRules {
  accept: readonly AcceptedFileType[];
  maxFiles: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes?: number;
}

export interface FileValidationResult {
  accepted: File[];
  rejections: FileRejection[];
}

export type FileUploaderVariant = 'dialog' | 'minimal';
