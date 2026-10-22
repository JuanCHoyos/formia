export interface UploadItem {
  id: number;
  file: File;
  previewUrl: string | null;
  loaded: number;
  status: 'complete' | 'error' | 'queued' | 'uploading';
}
