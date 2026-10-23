import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { TextEditor } from './text-editor';

describe('TextEditor', () => {
  let fixture: ComponentFixture<TextEditor>;
  let component: TextEditor;
  let touches: number;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(TextEditor);
    component = fixture.componentInstance;
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('renders the toolbar and the editor with a translated placeholder', async () => {
    const element = await render();

    expect(element.querySelector('ngx-editor-menu')).not.toBeNull();
    expect(element.querySelector('ngx-editor')).not.toBeNull();
    expect(element.innerHTML).toContain('common.editor.placeholder');
  });

  it('shows the value written to the model', async () => {
    component.value.set('<p>Hello</p>');
    const element = await render();

    expect(element.querySelector('.ProseMirror')?.textContent).toContain('Hello');
  });

  it('disables the field when disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    await render();

    expect(component.textEditorForm().disabled()).toBe(true);
  });

  it('marks the field as touched', () => {
    component.markAsTouched();

    expect(touches).toBe(1);
    expect(component.textEditorForm().touched()).toBe(true);
  });

  it('destroys the editor with the component', async () => {
    await render();
    const destroy = vi.spyOn(component.editor(), 'destroy');

    fixture.destroy();

    expect(destroy).toHaveBeenCalledOnce();
  });
});
