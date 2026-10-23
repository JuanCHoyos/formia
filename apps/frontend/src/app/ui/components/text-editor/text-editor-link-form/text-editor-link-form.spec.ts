import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { TextEditorLinkForm, type TextEditorLinkValue } from './text-editor-link-form';

describe('TextEditorLinkForm', () => {
  let fixture: ComponentFixture<TextEditorLinkForm>;
  let applied: TextEditorLinkValue[];

  const render = async (href: string | null, text: string) => {
    fixture.componentRef.setInput('href', href);
    fixture.componentRef.setInput('text', text);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  const inputs = (element: HTMLElement) => {
    const [text, url] = Array.from(element.querySelectorAll('input'));
    return { text, url };
  };

  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TextEditorLinkForm);
    applied = [];
    fixture.componentInstance.applied.subscribe((value) => applied.push(value));
  });

  it('prefills the text and URL and focuses the URL when there is text', async () => {
    const element = await render('https://a.dev', 'Docs');
    const { text, url } = inputs(element);

    expect(text.value).toBe('Docs');
    expect(url.value).toBe('https://a.dev');
    expect(document.activeElement).toBe(url);
  });

  it('focuses the text first when there is none', async () => {
    const element = await render(null, '');

    expect(document.activeElement).toBe(inputs(element).text);
  });

  it('applies the normalized URL with the trimmed text', async () => {
    const element = await render(null, '');
    const { text, url } = inputs(element);

    type(text, '  Pliego  ');
    type(url, 'pliego.app');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));

    expect(applied).toEqual([{ href: 'https://pliego.app', text: 'Pliego' }]);
  });

  it('does not apply an invalid URL and shows the error', async () => {
    const element = await render(null, 'Text');

    type(inputs(element).url, 'not a url');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(applied).toEqual([]);
    expect(element.textContent).toContain('textEditor.link.invalid');
  });

  it('offers removing only an existing link', async () => {
    let removed = 0;
    fixture.componentInstance.removed.subscribe(() => removed++);
    const element = await render('https://a.dev', 'Docs');
    const remove = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('textEditor.link.remove'),
    );

    remove?.click();

    expect(removed).toBe(1);
  });
});
