import { CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';

import { provideTranslateService } from '@ngx-translate/core';

import { query, typeInto } from '@/testing/dom';

import type { SelectOptionImage } from '../../types/select-option';
import { ImageOptionEditor } from './image-option-editor';

type OptionDrop = CdkDragDrop<FieldTree<SelectOptionImage[], number | string, 'writable'>>;

describe('ImageOptionEditor', () => {
  let fixture: ComponentFixture<ImageOptionEditor>;
  let component: ImageOptionEditor;
  let touches: number;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const deleteButtons = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('button')).filter((button) =>
      button.getAttribute('aria-label')?.startsWith('common.actions.deleteItem'),
    );
  const addButton = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('formBuilder.properties.select.addOption'),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(ImageOptionEditor);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('inputId', 'images');
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('starts with one empty option with an uploader and no delete button', async () => {
    const element = await render();

    expect(component.value()).toMatchObject([{ label: '', value: '', image: '' }]);
    expect(element.querySelectorAll('app-file-uploader')).toHaveLength(1);
    expect(deleteButtons(element)).toHaveLength(0);
  });

  it('adds options and allows deleting any of them', async () => {
    addButton(await render())?.click();
    const element = await render();

    expect(component.value()).toHaveLength(2);
    expect(element.querySelectorAll('app-file-uploader')).toHaveLength(2);

    deleteButtons(element)[1].click();
    expect(component.value()).toHaveLength(1);
  });

  it('writes the typed label and value to the option', async () => {
    const element = await render();

    typeInto(query<HTMLInputElement>(element, '#images-label-0'), 'Cat');
    typeInto(query<HTMLInputElement>(element, '#images-value-0'), 'cat');

    expect(component.value()).toMatchObject([{ label: 'Cat', value: 'cat', image: '' }]);
  });

  it('moves an option to the dropped position', () => {
    component.value.set([
      { label: 'A', value: 'a', image: '' },
      { label: 'B', value: 'b', image: '' },
    ]);

    component.drop({ previousIndex: 1, currentIndex: 0 } as OptionDrop);

    expect(component.value().map((option) => option.value)).toEqual(['b', 'a']);
  });

  it('adds a drag handle column when sorting is enabled', async () => {
    expect(component.gridTemplateColumns()).toBe('1fr 1fr 1fr auto');

    fixture.componentRef.setInput('sort', true);
    const element = await render();

    expect(component.gridTemplateColumns()).toBe('auto 1fr 1fr 1fr 28px');
    expect(element.querySelector('[cdkdraghandle]')).not.toBeNull();
  });

  it('disables the inputs when disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    const element = await render();

    expect(query<HTMLInputElement>(element, '#images-value-0').disabled).toBe(true);
  });

  it('marks the options as touched', () => {
    component.markAsTouched();

    expect(touches).toBe(1);
    expect(component.optionEditorForm().touched()).toBe(true);
  });
  it('reorders the options when one is dropped in the list', async () => {
    component.value.set([
      { label: 'A', value: 'a', image: '' },
      { label: 'B', value: 'b', image: '' },
    ]);
    await render();
    const list = fixture.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);

    list.dropped.emit({ previousIndex: 0, currentIndex: 1 } as OptionDrop);

    expect(component.value().map((option) => option.value)).toEqual(['b', 'a']);
  });
});
