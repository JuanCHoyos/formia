import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { Dialog } from 'primeng/dialog';

import { query } from '@/testing/dom';

import type { FileRejection, UploadedFile } from '../../types/file-upload';
import { FileUploader } from './file-uploader';

function createFile(name: string, type = 'image/png', size = 10): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('FileUploader', () => {
  let fixture: ComponentFixture<FileUploader>;
  let uploader: FileUploader;
  let emitted: File[][];
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const setInputs = (inputs: Record<string, unknown>) => {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
  };
  const addFiles = (files: File[]) => uploader['addFiles'](files);
  const queuedNames = () => uploader['files']().map((file) => file.name);

  beforeEach(async () => {
    let urls = 0;
    createObjectURL = vi.fn(() => `blob:preview-${urls++}`);
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    TestBed.configureTestingModule({
      imports: [FileUploader],
      providers: [provideTranslateService()],
    });
    fixture = TestBed.createComponent(FileUploader);
    uploader = fixture.componentInstance;
    setInputs({ multiple: true, accept: ['image/png'], maxFiles: 2 });
    emitted = [];
    uploader.filesSelected.subscribe((files) => emitted.push(files));
    await render();
  });

  afterEach(() => vi.unstubAllGlobals());

  describe('dialog variant', () => {
    it('opens the dialog from its own button', async () => {
      const element = await render();

      query<HTMLButtonElement>(element, 'app-button button').click();
      await render();

      expect(uploader['visible']()).toBe(true);
      expect(document.body.textContent).toContain('fileUploader.dropFiles');
    });

    it('hides its button so the host can open the dialog', async () => {
      setInputs({ hideTrigger: true });
      const element = await render();

      expect(element.querySelector('app-button')).toBeNull();
      uploader.open();
      expect(uploader['visible']()).toBe(true);
    });

    it('emits the selection only when it is confirmed', async () => {
      const first = createFile('a.png');
      const second = createFile('b.png');
      uploader.open();
      await render();

      addFiles([first]);
      addFiles([second]);
      expect(emitted).toEqual([]);

      uploader['confirmSelection']();
      expect(emitted).toEqual([[first, second]]);
      expect(uploader['files']()).toEqual([]);
      expect(uploader['visible']()).toBe(false);
    });

    it('discards the selection when the dialog is dismissed', async () => {
      uploader.open();
      await render();
      addFiles([createFile('a.png'), createFile('b.gif', 'image/gif')]);

      const dialog: Dialog = fixture.debugElement.query(By.directive(Dialog)).componentInstance;
      dialog.close(new Event('click'));
      await render();

      expect(emitted).toEqual([]);
      expect(uploader['files']()).toEqual([]);
      expect(uploader['rejections']()).toEqual([]);
      expect(uploader['visible']()).toBe(false);
    });

    it('lists the queued files with their total against the limit', async () => {
      setInputs({ maxTotalSizeMb: 1 });
      uploader.open();
      addFiles([createFile('photo.png', 'image/png', 2048)]);
      await render();

      const body = document.body.textContent ?? '';
      expect(body).toContain('photo.png');
      expect(body).toContain('2 KB');
      expect(body).toContain('/ 1 MB');
      expect(document.body.querySelector('img[alt="photo.png"]')?.getAttribute('src')).toBe(
        'blob:preview-0',
      );
    });

    it('shows the history, with a thumbnail for images and an icon for other files', async () => {
      const history: UploadedFile[] = [
        {
          id: '1',
          name: 'banner.png',
          size: 1024,
          type: 'image/png',
          url: 'https://cdn.example.com/banner.png',
          uploadedAt: '2026-01-15T10:00:00Z',
        },
        { id: '2', name: 'terms.pdf', size: 512, type: 'application/pdf' },
      ];
      setInputs({ history });
      uploader.open();
      await render();

      const body = document.body.textContent ?? '';
      expect(body).toContain('banner.png');
      expect(body).toContain('Jan 15, 2026');
      expect(body).toContain('512 B');
      expect(document.body.querySelector('img[alt="banner.png"]')?.getAttribute('src')).toBe(
        history[0].url,
      );
      expect(document.body.querySelector('img[alt="terms.pdf"]')).toBeNull();
    });

    it('shows an empty history message when nothing was uploaded before', async () => {
      uploader.open();
      await render();

      expect(document.body.textContent).toContain('fileUploader.history.empty');
    });

    it('disables Done until a file is queued', async () => {
      uploader.open();
      await render();
      const done = () =>
        Array.from(document.body.querySelectorAll('button')).find((button) =>
          button.textContent?.includes('fileUploader.done'),
        );

      expect(done()?.disabled).toBe(true);

      addFiles([createFile('a.png')]);
      await render();
      expect(done()?.disabled).toBe(false);
    });
  });

  describe('minimal variant', () => {
    beforeEach(async () => {
      setInputs({ variant: 'minimal' });
      await render();
    });

    it('renders inline without a dialog', async () => {
      const element = await render();

      expect(element.querySelector('p-dialog')).toBeNull();
      expect(element.textContent).toContain('fileUploader.dropFiles');
    });

    it('emits the valid files on every change', () => {
      const valid = createFile('a.png');

      addFiles([valid, createFile('b.gif', 'image/gif')]);
      uploader['removeFile'](valid);

      expect(emitted).toEqual([[valid], []]);
    });

    it('does not emit when every new file is rejected', () => {
      addFiles([createFile('b.gif', 'image/gif')]);

      expect(emitted).toEqual([]);
    });

    it('reads the files chosen in the file picker and resets it', async () => {
      const element = await render();
      const input = query<HTMLInputElement>(element, 'input[type="file"]');
      const file = createFile('picked.png');
      Object.defineProperty(input, 'files', { value: [file], configurable: true });

      input.dispatchEvent(new Event('change'));

      expect(emitted).toEqual([[file]]);
      expect(input.value).toBe('');
    });

    it('ignores change events that do not come from an input element', () => {
      uploader['selectFiles'](new Event('change'));

      expect(emitted).toEqual([]);
    });

    it('adds the files dropped on the zone', async () => {
      const element = await render();
      const file = createFile('dropped.png');
      const drop = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(drop, 'dataTransfer', {
        value: { types: ['Files'], files: [file] },
      });

      query(element, '[appfiledropzone]').dispatchEvent(drop);

      expect(emitted).toEqual([[file]]);
    });

    it('highlights the zone while files are dragged over it', async () => {
      const element = await render();
      const zone = query(element, '[appfiledropzone]');
      const dragEnter = new Event('dragenter', { bubbles: true, cancelable: true });
      Object.defineProperty(dragEnter, 'dataTransfer', { value: { types: ['Files'] } });

      zone.dispatchEvent(dragEnter);
      await render();

      expect(zone.classList).toContain('border-brand');
    });

    it('shows the rejections and lets the user dismiss them', async () => {
      addFiles([createFile('b.gif', 'image/gif')]);
      let element = await render();

      expect(query(element, '[role="alert"]').textContent).toContain(
        'fileUploader.rejections.type',
      );

      query<HTMLButtonElement>(element, '[role="alert"] button').click();
      element = await render();
      expect(element.querySelector('[role="alert"]')).toBeNull();
    });

    it('removes a queued file from its delete button', async () => {
      addFiles([createFile('a.png')]);
      const element = await render();

      query<HTMLButtonElement>(element, 'button[aria-label="common.actions.deleteItem"]').click();

      expect(emitted.at(-1)).toEqual([]);
    });
  });

  it('replaces the file instead of adding another one in single mode', () => {
    setInputs({ multiple: false, variant: 'minimal' });
    const first = createFile('a.png');
    const second = createFile('b.png');

    addFiles([first]);
    addFiles([second]);

    expect(queuedNames()).toEqual(['b.png']);
  });

  it('creates previews only for images and releases them when files leave the queue', async () => {
    setInputs({ accept: [] });
    const image = createFile('a.png');
    addFiles([image, createFile('notes.txt', 'text/plain')]);

    expect(uploader['queue']().map((item) => item.previewUrl)).toEqual(['blob:preview-0', null]);
    expect(createObjectURL).toHaveBeenCalledOnce();

    uploader['removeFile'](image);
    await render();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-0');
  });

  it('releases the remaining previews when destroyed', async () => {
    addFiles([createFile('a.png')]);
    uploader['queue']();
    await render();

    fixture.destroy();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-0');
  });

  describe('limits text', () => {
    it.each([
      [{ multiple: false }, 'fileUploader.limits.single'],
      [{ multiple: true, maxFiles: 3 }, 'fileUploader.limits.count'],
      [{ multiple: true, maxFiles: undefined }, 'fileUploader.limits.unlimited'],
    ])('describes the file count for %o', (inputs, key) => {
      setInputs(inputs);

      expect(uploader['limitsSummary']()).toBe(`${key} · fileUploader.limits.fileSize`);
    });

    it('adds the total size limit when set', () => {
      setInputs({ maxTotalSizeMb: 20 });

      expect(uploader['limitsSummary']()).toContain('fileUploader.limits.totalSize');
    });

    it('labels the accepted types without repeats, translating wildcards', () => {
      setInputs({ accept: ['image/*', 'application/pdf', '.pdf', 'video/*'] });

      expect(uploader['acceptedTypesLabel']()).toBe(
        'fileUploader.types.image, PDF, fileUploader.types.video',
      );
    });
  });

  describe('rejection messages', () => {
    let instant: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      setInputs({ maxFileSizeMb: 5, maxTotalSizeMb: 20 });
      instant = vi.spyOn(TestBed.inject(TranslateService), 'instant');
    });

    it.each([
      ['type', '5 MB'],
      ['fileSize', '5 MB'],
      ['totalSize', '20 MB'],
      ['count', '5 MB'],
      ['duplicate', '5 MB'],
    ] as const)('explains a %s rejection', (reason, size) => {
      const rejection: FileRejection = { file: createFile('a.png'), reason };

      uploader['rejectionMessage'](rejection);

      expect(instant).toHaveBeenCalledWith(`fileUploader.rejections.${reason}`, {
        name: 'a.png',
        count: 2,
        size,
      });
    });

    it('falls back to zero when no total limit is set', () => {
      setInputs({ maxTotalSizeMb: undefined });

      uploader['rejectionMessage']({ file: createFile('a.png'), reason: 'totalSize' });

      expect(instant).toHaveBeenCalledWith(
        'fileUploader.rejections.totalSize',
        expect.objectContaining({ size: '0 B' }),
      );
    });
  });

  it('formats dates in the current language and skips invalid ones', () => {
    TestBed.inject(TranslateService).use('es');

    expect(uploader['formatDate']('2026-01-15T10:00:00Z')).toBe('15 ene 2026');
    expect(uploader['formatDate']('not a date')).toBe('');
  });

  it('recognises image types', () => {
    expect(uploader['isImage']('image/webp')).toBe(true);
    expect(uploader['isImage']('application/pdf')).toBe(false);
    expect(uploader['isImage'](undefined)).toBe(false);
  });
  describe('template actions', () => {
    const buttonWithText = (root: ParentNode, text: string) =>
      Array.from(root.querySelectorAll('button')).find((button) =>
        button.textContent?.includes(text),
      );
    const fileInputClick = (element: HTMLElement) =>
      vi.spyOn(query<HTMLInputElement>(element, 'input[type="file"]'), 'click');

    it('opens the file picker from the minimal variant', async () => {
      setInputs({ variant: 'minimal' });
      const element = await render();
      const click = fileInputClick(element);

      buttonWithText(element, 'fileUploader.browse')?.click();

      expect(click).toHaveBeenCalledOnce();
    });

    it('opens the file picker, accepts drops and confirms from the dialog', async () => {
      const element = await render();
      const click = fileInputClick(element);
      uploader.open();
      await render();

      buttonWithText(document.body, 'fileUploader.browse')?.click();
      expect(click).toHaveBeenCalledOnce();

      const zone = query(document.body, 'p-dialog [appfiledropzone]');
      const dragEnter = new Event('dragenter', { bubbles: true, cancelable: true });
      Object.defineProperty(dragEnter, 'dataTransfer', { value: { types: ['Files'] } });
      zone.dispatchEvent(dragEnter);
      await render();
      expect(uploader['dragActive']()).toBe(true);

      const file = createFile('dropped.png');
      const drop = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(drop, 'dataTransfer', { value: { types: ['Files'], files: [file] } });
      zone.dispatchEvent(drop);
      await render();

      buttonWithText(document.body, 'fileUploader.done')?.click();
      expect(emitted).toEqual([[file]]);
    });

    it('discards the selection from the cancel button', async () => {
      uploader.open();
      addFiles([createFile('a.png')]);
      await render();

      buttonWithText(document.body, 'common.actions.cancel')?.click();

      expect(uploader['visible']()).toBe(false);
      expect(emitted).toEqual([]);
    });
  });

  it('handles a file picker without files', async () => {
    setInputs({ variant: 'minimal' });
    const element = await render();
    const input = query<HTMLInputElement>(element, 'input[type="file"]');
    Object.defineProperty(input, 'files', { value: null, configurable: true });

    input.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([]);
  });

  it('accepts any number of files when multiple has no maximum', () => {
    setInputs({ maxFiles: undefined });

    addFiles([createFile('a.png'), createFile('b.png'), createFile('c.png')]);

    expect(queuedNames()).toEqual(['a.png', 'b.png', 'c.png']);
  });

  it('reuses the preview of a file that stays in the queue', () => {
    addFiles([createFile('a.png')]);
    uploader['queue']();
    addFiles([createFile('b.png')]);

    expect(uploader['queue']().map((item) => item.previewUrl)).toEqual([
      'blob:preview-0',
      'blob:preview-1',
    ]);
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });
});
