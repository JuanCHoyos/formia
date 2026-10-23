import { TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import type {
  AppFormlyFieldConfig,
  FormPageContainer,
} from '@/app/formly/types/app-formly-field-config';
import { Notifications } from '@/app/ui/services/notifications';

import { FieldConfigFactory } from './field-config-factory';
import { FormBuilderStore } from './form-builder-store';

function relabel(store: FormBuilderStore, field: AppFormlyFieldConfig, label: string): void {
  if (field.type !== 'text') throw new Error('Expected a text field');
  store.formTreeEditor.updateElement(field.id, { ...field, props: { ...field.props, label } });
}

function labelOf(field: AppFormlyFieldConfig | FormPageContainer | null): string | undefined {
  return field && 'label' in field.props ? field.props.label : undefined;
}

describe('FormBuilderStore selection', () => {
  let store: FormBuilderStore;
  let factory: FieldConfigFactory;

  const page = () => store.fields().fieldGroup[0];
  const fieldIn = (id: string) => page().fieldGroup.find((field) => field.id === id);
  const addText = (label: string, parentId = page().id): AppFormlyFieldConfig => {
    const field = factory.createFormFieldConf('text', label);
    store.formTreeEditor.addFieldToGroup(parentId, field);
    return field;
  };

  beforeEach(() => {
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
  });

  it('starts with nothing selected', () => {
    expect(store.selectedField()).toBeNull();
  });

  it('returns the live field object from the form, not the object that was selected', () => {
    const field = addText('Name');
    store.selectField(field);

    expect(store.selectedField()).toBe(fieldIn(field.id));
  });

  it('keeps the selection on the same field when other fields are added', () => {
    const name = addText('Name');
    store.selectField(fieldIn(name.id) ?? null);

    addText('Email');

    expect(store.selectedField()?.id).toBe(name.id);
    expect(store.selectedField()).toBe(fieldIn(name.id));
  });

  it('reflects edits made to the selected field', () => {
    const name = addText('Name');
    store.selectField(name);

    relabel(store, name, 'Full name');

    expect(labelOf(store.selectedField())).toBe('Full name');
    expect(store.selectedField()).toBe(fieldIn(name.id));
  });

  it('follows undo and redo, and clears when the field no longer exists', () => {
    const name = addText('Name');
    store.selectField(name);
    relabel(store, name, 'Edited');

    store.formTreeHistory.undo();
    expect(labelOf(store.selectedField())).toBe('Name');

    store.formTreeHistory.undo();
    expect(store.selectedField()).toBeNull();

    store.formTreeHistory.redo();
    expect(store.selectedField()?.id).toBe(name.id);
  });

  it('clears the selection when the selected field is deleted', () => {
    const name = addText('Name');
    store.selectField(name);

    store.formTreeEditor.removeFieldFromGroup(name.id);

    expect(store.selectedField()).toBeNull();
  });

  it('finds fields nested in groups and pages themselves', () => {
    const group = factory.createFormFieldConf('container-group', 'Group');
    store.formTreeEditor.addFieldToGroup(page().id, group);
    const nested = addText('Nested', group.id);

    store.selectField(nested);
    expect(store.selectedField()?.id).toBe(nested.id);

    store.selectField(page());
    expect(store.selectedField()).toBe(page());
  });

  it('clears the selection when a page is added or a form is loaded', () => {
    store.selectField(addText('Name'));
    store.addPage(factory.createFormPageContainer('Second'));
    expect(store.selectedField()).toBeNull();

    store.selectField(addText('Email'));
    store.load('Survey', undefined);
    expect(store.selectedField()).toBeNull();
  });
});
