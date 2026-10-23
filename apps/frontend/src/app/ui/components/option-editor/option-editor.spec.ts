import { CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { FieldTree } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';

import { provideTranslateService } from '@ngx-translate/core';

import { query, typeInto } from '@/testing/dom';

import type { SelectOption } from '../../types/select-option';
import { OptionEditor } from './option-editor';

type OptionDrop = CdkDragDrop<FieldTree<SelectOption[], number | string, 'writable'>>;

describe('OptionEditor', () => {
  let fixture: ComponentFixture<OptionEditor>;
  let component: OptionEditor;
  let touches: number;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const addButton = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('formBuilder.properties.select.addOption'),
    );
  const deleteButtons = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('button')).filter((button) =>
      button.getAttribute('aria-label')?.startsWith('common.actions.deleteItem'),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(OptionEditor);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('inputId', 'options');
    touches = 0;
    component.touch.subscribe(() => touches++);
  });

  it('starts with one empty option that cannot be deleted', async () => {
    const element = await render();

    expect(component.value()).toMatchObject([{ label: '', value: '' }]);
    expect(element.querySelector('#options-label-0')).not.toBeNull();
    expect(deleteButtons(element)).toHaveLength(0);
  });

  it('adds options and shows a delete button for each one', async () => {
    addButton(await render())?.click();
    const element = await render();

    expect(component.value()).toHaveLength(2);
    expect(deleteButtons(element)).toHaveLength(2);
  });

  it('writes the typed label and value to the option', async () => {
    const element = await render();

    typeInto(query<HTMLInputElement>(element, '#options-label-0'), 'Yes');
    typeInto(query<HTMLInputElement>(element, '#options-value-0'), 'yes');

    expect(component.value()).toMatchObject([{ label: 'Yes', value: 'yes' }]);
  });

  it('removes the chosen option', async () => {
    component.value.set([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ]);
    const element = await render();

    deleteButtons(element)[0].click();

    expect(component.value()).toMatchObject([{ label: 'B', value: 'b' }]);
  });

  it('moves an option to the dropped position', () => {
    component.value.set([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c' },
    ]);

    component.drop({ previousIndex: 0, currentIndex: 2 } as OptionDrop);

    expect(component.value().map((option) => option.value)).toEqual(['b', 'c', 'a']);
  });

  it('shows drag handles only when sorting is enabled', async () => {
    expect((await render()).querySelector('[cdkDragHandle]')).toBeNull();

    fixture.componentRef.setInput('sort', true);
    expect((await render()).querySelector('[cdkdraghandle]')).not.toBeNull();
  });

  it('disables the inputs when disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    const element = await render();

    expect(query<HTMLInputElement>(element, '#options-label-0').disabled).toBe(true);
    expect(component.optionEditorForm().disabled()).toBe(true);
  });

  it('marks the options as touched', () => {
    component.markAsTouched();

    expect(touches).toBe(1);
    expect(component.optionEditorForm().touched()).toBe(true);
  });
  it('reorders the options when one is dropped in the list', async () => {
    component.value.set([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ]);
    await render();
    const list = fixture.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);

    list.dropped.emit({ previousIndex: 0, currentIndex: 1 } as OptionDrop);

    expect(component.value().map((option) => option.value)).toEqual(['b', 'a']);
  });
});
