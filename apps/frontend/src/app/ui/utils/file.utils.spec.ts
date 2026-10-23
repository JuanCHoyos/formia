import type { FileUploadRules } from '../types/file-upload';
import { formatBytes, getFileTypeLabel, isAcceptedFile, validateFiles } from './file.utils';

function createFile(name: string, size: number, type: string, lastModified = 1): File {
  return new File([new Uint8Array(size)], name, { type, lastModified });
}

const rules: FileUploadRules = {
  accept: ['image/png', '.pdf'],
  maxFiles: 3,
  maxFileSizeBytes: 100,
  maxTotalSizeBytes: 150,
};

describe('isAcceptedFile', () => {
  it.each([
    ['an exact MIME type', createFile('a.png', 1, 'image/png'), ['image/png'], true],
    ['a wildcard MIME type', createFile('a.webp', 1, 'image/webp'), ['image/*'], true],
    ['an extension', createFile('doc.PDF', 1, ''), ['.pdf'], true],
    ['a type outside the list', createFile('a.gif', 1, 'image/gif'), ['image/png'], false],
    ['any type when the list is empty', createFile('a.zip', 1, 'application/zip'), [], true],
  ])('handles %s', (_case, file, accept, expected) => {
    expect(isAcceptedFile(file, accept)).toBe(expected);
  });
});

describe('validateFiles', () => {
  it('accepts files that meet every rule', () => {
    const files = [createFile('a.png', 50, 'image/png'), createFile('b.pdf', 50, '')];

    const result = validateFiles([], files, rules);

    expect(result.accepted).toEqual(files);
    expect(result.rejections).toEqual([]);
  });

  it('rejects files by type and by size per file', () => {
    const gif = createFile('a.gif', 10, 'image/gif');
    const large = createFile('large.png', 101, 'image/png');

    const result = validateFiles([], [gif, large], rules);

    expect(result.accepted).toEqual([]);
    expect(result.rejections).toEqual([
      { file: gif, reason: 'type' },
      { file: large, reason: 'fileSize' },
    ]);
  });

  it('rejects files that exceed the total size, counting the files already added', () => {
    const current = [createFile('a.png', 100, 'image/png')];
    const next = createFile('b.png', 60, 'image/png');

    const result = validateFiles(current, [next], rules);

    expect(result.accepted).toEqual(current);
    expect(result.rejections).toEqual([{ file: next, reason: 'totalSize' }]);
  });

  it('rejects duplicates and files beyond the maximum count', () => {
    const first = createFile('a.png', 10, 'image/png');
    const duplicate = createFile('a.png', 10, 'image/png');
    const extra = createFile('d.png', 10, 'image/png', 4);
    const current = [
      first,
      createFile('b.png', 10, 'image/png', 2),
      createFile('c.png', 10, 'image/png', 3),
    ];

    const result = validateFiles(current, [duplicate, extra], rules);

    expect(result.accepted).toEqual(current);
    expect(result.rejections).toEqual([
      { file: duplicate, reason: 'duplicate' },
      { file: extra, reason: 'count' },
    ]);
  });
});

describe('formatBytes', () => {
  it('formats bytes with the closest unit', () => {
    expect(formatBytes(512, 'en')).toBe('512 B');
    expect(formatBytes(5 * 1024 * 1024, 'en')).toBe('5 MB');
    expect(formatBytes(1536, 'en')).toBe('1.5 KB');
  });
});

describe('getFileTypeLabel', () => {
  it.each([
    ['.pdf', 'PDF'],
    ['image/png', 'PNG'],
    ['image/svg+xml', 'SVG'],
    ['text/plain', 'TXT'],
  ])('labels %s as %s', (type, label) => {
    expect(getFileTypeLabel(type)).toBe(label);
  });
});
