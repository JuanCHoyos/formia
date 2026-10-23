import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import type { AppFormlyFieldConfig } from '@/app/formly/types/app-formly-field-config';
import { Notifications } from '@/app/ui/services/notifications';
import { query } from '@/testing/dom';

import { FieldConfigFactory } from '../../services/field-config-factory';
import { FormBuilderStore } from '../../services/form-builder-store';
import { BuilderSidebar } from './builder-sidebar';

/** Selection sync between the canvas (the store) and the field tree. */

function relabel(store: FormBuilderStore, field: AppFormlyFieldConfig, label: string): void {
  if (field.type !== 'text') throw new Error('Expected a text field');
  store.formTreeEditor.updateElement(field.id, { ...field, props: { ...field.props, label } });
}

describe('BuilderSidebar tree selection', () => {
  let fixture: ComponentFixture<BuilderSidebar> | null;
  let store: FormBuilderStore;
  let factory: FieldConfigFactory;

  const page = () => store.fields().fieldGroup[0];
  const addText = (label: string, parentId = page().id): AppFormlyFieldConfig => {
    const field = factory.createFormFieldConf('text', label);
    store.formTreeEditor.addFieldToGroup(parentId, field);
    return field;
  };
  /** Mounts the sidebar on the tree tab, like opening the tree. */
  const openTree = async () => {
    fixture = TestBed.createComponent(BuilderSidebar);
    fixture.detectChanges();
    await fixture.whenStable();
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('[role="tab"]'))
      .find((tab) => tab.textContent?.includes('formBuilder.sidebar.tree'))
      ?.click();
    return render();
  };
  const closeTree = () => {
    fixture?.destroy();
    fixture = null;
  };
  const render = async () => {
    if (!fixture) throw new Error('The tree is closed');
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };
  const treeRow = (element: HTMLElement, id: string) =>
    query(element, `[data-tree-item-id="${id}"] [tabindex="0"]`);
  const currentIds = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('[aria-current="true"]')).map((row) =>
      row.closest('[data-tree-item-id]')?.getAttribute('data-tree-item-id'),
    );

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn<Element['scrollIntoView']>();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        {
          provide: Notifications,
          useValue: { success: vi.fn(), error: vi.fn(), warn: vi.fn() },
        },
      ],
    });
    store = TestBed.inject(FormBuilderStore);
    factory = TestBed.inject(FieldConfigFactory);
    fixture = null;
  });

  afterEach(() => {
    closeTree();
    vi.unstubAllGlobals();
  });

  it('selects in the canvas the field picked in the tree', async () => {
    const name = addText('Name');
    const element = await openTree();

    treeRow(element, name.id).click();

    expect(store.selectedField()?.id).toBe(name.id);
    expect(currentIds(await render())).toEqual([name.id]);
  });

  it('highlights in the open tree the field selected in the canvas', async () => {
    const name = addText('Name');
    const email = addText('Email');
    await openTree();

    store.selectField(name);
    expect(currentIds(await render())).toEqual([name.id]);

    store.selectField(email);
    expect(currentIds(await render())).toEqual([email.id]);
  });

  it('shows the canvas selection when the tree is opened afterwards', async () => {
    const name = addText('Name');
    store.selectField(name);
    relabel(store, name, 'Full name');
    addText('Email');

    expect(currentIds(await openTree())).toEqual([name.id]);
  });

  it('keeps the selection in sync for fields added while the tree was closed', async () => {
    const name = addText('Name');
    store.selectField(name);
    await openTree();
    closeTree();

    const added = addText('Added later');
    store.selectField(added);
    relabel(store, added, 'Edited');
    store.formTreeHistory.undo();
    let element = await openTree();
    expect(currentIds(element)).toEqual([added.id]);

    store.selectField(name);
    element = await render();
    expect(currentIds(element)).toEqual([name.id]);

    treeRow(element, added.id).click();
    expect(store.selectedField()?.id).toBe(added.id);
    expect(currentIds(await render())).toEqual([added.id]);
  });

  it('keeps the highlight while the selected field is edited or other fields are added', async () => {
    const name = addText('Name');
    store.selectField(name);
    await openTree();

    relabel(store, name, 'Full name');
    addText('Email');
    const element = await render();

    expect(currentIds(element)).toEqual([name.id]);
    expect(treeRow(element, name.id).textContent).toContain('Full name');
  });

  it('reveals a selected field nested in a collapsed group', async () => {
    const group = factory.createFormFieldConf('container-group', 'Group');
    store.formTreeEditor.addFieldToGroup(page().id, group);
    const nested = addText('Nested', group.id);
    let element = await openTree();
    query<HTMLButtonElement>(treeRow(element, group.id), 'button').click();
    element = await render();
    expect(element.querySelector(`[data-tree-item-id="${nested.id}"]`)).toBeNull();

    store.selectField(nested);
    element = await render();

    expect(currentIds(element)).toEqual([nested.id]);
  });

  it('clears the tree highlight when the selected field is deleted', async () => {
    const name = addText('Name');
    store.selectField(name);
    await openTree();

    store.formTreeEditor.removeFieldFromGroup(name.id);

    expect(currentIds(await render())).toEqual([]);
  });
});
