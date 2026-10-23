import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';

import { provideTranslateService } from '@ngx-translate/core';

import { TextEditor } from './text-editor';
import { richTextMaxLength } from './text-editor.validators';

describe('TextEditor', () => {
  let fixture: ComponentFixture<TextEditor>;
  let component: TextEditor;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  const content = (element: HTMLElement) => {
    const editable = element.querySelector<HTMLElement>('[role="textbox"]');
    if (!editable) {
      throw new Error('Editable area not rendered');
    }
    return editable;
  };

  const selectAll = (element: Element | null) => {
    if (!element) {
      throw new Error('Element not rendered');
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TextEditor);
    component = fixture.componentInstance;
  });

  afterEach(() => document.getSelection()?.removeAllRanges());

  it('renders a labelled toolbar and an accessible editable area', async () => {
    fixture.componentRef.setInput('inputId', 'description');
    fixture.componentRef.setInput('ariaLabelledBy', 'description-label');
    const element = await render();
    const editable = content(element);

    expect(element.querySelector('[role="toolbar"]')?.getAttribute('aria-controls')).toBe(
      'description',
    );
    expect(editable.id).toBe('description');
    expect(editable.getAttribute('contenteditable')).toBe('true');
    expect(editable.getAttribute('aria-multiline')).toBe('true');
    expect(editable.getAttribute('aria-labelledby')).toBe('description-label');
  });

  it('shows the placeholder only while empty', async () => {
    fixture.componentRef.setInput('placeholder', 'Write something');
    let element = await render();
    expect(element.textContent).toContain('Write something');

    component.value.set('<p>Hello</p>');
    element = await render();
    expect(element.textContent).not.toContain('Write something');
  });

  it('renders the model value sanitized', async () => {
    component.value.set('<p>Hello <strong>world</strong><script>alert(1)</script></p>');
    const element = await render();

    expect(content(element).innerHTML).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('writes sanitized html to the model after typing', async () => {
    const element = await render();
    const editable = content(element);

    editable.innerHTML = '<p>Typed <b>text</b></p>';
    editable.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: 't' }));

    expect(component.value()).toBe('<p>Typed <strong>text</strong></p>');
  });

  it('writes an empty string when the content is cleared', async () => {
    component.value.set('<p>Hello</p>');
    const element = await render();
    const editable = content(element);

    editable.innerHTML = '<p><br></p>';
    editable.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward' }));

    expect(component.value()).toBe('');
  });

  it('runs toolbar commands on the selection', async () => {
    component.value.set('<p>Hello</p>');
    const element = await render();
    selectAll(content(element).querySelector('p'));

    element.querySelector<HTMLButtonElement>('[data-toolbar-item="bold"]')?.click();

    expect(component.value()).toBe('<p><strong>Hello</strong></p>');
    await render();
    expect(element.querySelector('[data-toolbar-item="bold"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('hides tools that are not enabled', async () => {
    fixture.componentRef.setInput('tools', ['bold', 'italic']);
    const element = await render();

    expect(element.querySelector('[data-toolbar-item="bold"]')).not.toBeNull();
    expect(element.querySelector('[data-toolbar-item="link"]')).toBeNull();
  });

  it('locks editing and the toolbar when disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    const element = await render();
    const editable = content(element);

    expect(editable.getAttribute('contenteditable')).toBe('false');
    expect(editable.getAttribute('aria-disabled')).toBe('true');
    expect(editable.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector<HTMLButtonElement>('[data-toolbar-item="bold"]')?.disabled).toBe(
      true,
    );
  });

  it('shows read-only content without a toolbar', async () => {
    fixture.componentRef.setInput('readonly', true);
    component.value.set('<p>Read me</p>');
    const element = await render();
    const editable = content(element);

    expect(element.querySelector('[role="toolbar"]')).toBeNull();
    expect(editable.getAttribute('contenteditable')).toBe('false');
    expect(editable.getAttribute('aria-readonly')).toBe('true');
    expect(editable.textContent).toBe('Read me');
  });

  it('emits touch on blur', async () => {
    let touches = 0;
    component.touch.subscribe(() => touches++);
    const element = await render();

    content(element).dispatchEvent(new FocusEvent('blur'));

    expect(touches).toBe(1);
  });

  it('counts visible characters against maxLength', async () => {
    fixture.componentRef.setInput('maxLength', 3);
    component.value.set('<p><strong>abcd</strong></p>');
    const element = await render();

    expect(element.textContent).toContain('textEditor.counter');
    expect(content(element).getAttribute('aria-invalid')).toBe('true');
  });

  it('focuses the editable area', async () => {
    const element = await render();

    component.focus();

    expect(document.activeElement).toBe(content(element));
  });
});

@Component({
  imports: [FormField, TextEditor],
  template: `<app-text-editor [formField]="editorForm.text" />`,
})
class SignalFormHost {
  readonly model = signal({ text: '' });
  readonly editorForm = form(this.model, (path) => {
    required(path.text);
    richTextMaxLength(path.text, 5);
  });
}

describe('TextEditor with Signal Forms', () => {
  let fixture: ComponentFixture<SignalFormHost>;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(SignalFormHost);
  });

  it('syncs the value and validation state through formField', async () => {
    const host = fixture.componentInstance;
    const element = await render();
    const editable = element.querySelector<HTMLElement>('[role="textbox"]');
    if (!editable) {
      throw new Error('Editable area not rendered');
    }

    expect(host.editorForm.text().invalid()).toBe(true);
    expect(editable.getAttribute('aria-required')).toBe('true');

    editable.innerHTML = '<p><em>Hi</em></p>';
    editable.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: 'i' }));
    editable.dispatchEvent(new FocusEvent('blur'));
    await render();

    expect(host.model().text).toBe('<p><em>Hi</em></p>');
    expect(host.editorForm.text().valid()).toBe(true);
    expect(host.editorForm.text().touched()).toBe(true);

    host.model.set({ text: '<p>Too long</p>' });
    await render();

    expect(editable.textContent).toBe('Too long');
    expect(host.editorForm.text().invalid()).toBe(true);
    expect(editable.getAttribute('aria-invalid')).toBe('true');
    expect(element.textContent).toContain('textEditor.counter');
  });
});
