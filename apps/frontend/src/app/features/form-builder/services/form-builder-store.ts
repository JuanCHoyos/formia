import { computed, inject, Service, signal } from '@angular/core';
import type { FieldWrapperName } from '../formly/config/config-wrappers';
import type {
  AppFormlyFieldConfig,
  FormFieldConfiguration,
  FormPageContainer,
} from '../formly/interfaces/app-formly-field-config';
import { ulid } from 'ulid';
import { FormTreeEditor } from './form-tree-editor';
import { FormTreeHistory } from './form-tree-history';
import { TranslateService } from '@ngx-translate/core';
import { Notifications } from '@/app/ui/services/notifications';

export interface FormSettings {
  isPublic: boolean;
  allowMultipleSubmissions: boolean;
  maxSubmissionsPerUser: number;
}

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  isPublic: false,
  allowMultipleSubmissions: false,
  maxSubmissionsPerUser: 1,
};

@Service()
export class FormBuilderStore {
  private readonly notifications = inject(Notifications);
  private readonly translate = inject(TranslateService);

  readonly title = signal(this.defaultTitle());
  readonly settings = signal<FormSettings>({ ...DEFAULT_FORM_SETTINGS });

  fields = signal<FormFieldConfiguration>(this.createDefaultFields());

  dropListIds = computed(() => this.extractGroupIds(this.fields().fieldGroup));

  extractGroupIds(fields: (FormPageContainer | AppFormlyFieldConfig)[] = []): string[] {
    const keys: string[] = [];

    for (const field of fields) {
      if (field.type === 'container-group') {
        keys.push(...this.extractGroupIds(field.fieldGroup), field.id);
      }
    }

    return keys;
  }

  readonly formTreeHistory = new FormTreeHistory(this.fields);
  readonly formTreeEditor = new FormTreeEditor(this.formTreeHistory, this.notifications);

  formViewOptions = computed<
    { label: string; value: FieldWrapperName | undefined; disabled?: boolean }[]
  >(() => {
    this.translate.currentLang();
    return [
      {
        label: this.translate.instant('formBuilder.views.steps') as string,
        value: 'form-steps',
      },
      {
        label: this.translate.instant('formBuilder.views.scroll') as string,
        value: 'form-scroll',
      },
      { label: this.translate.instant('formBuilder.views.tabs') as string, value: 'form-tabs' },
    ];
  });

  selectedViewOption = computed<FieldWrapperName | undefined>(() => {
    const mainWrappers = this.fields().wrappers;
    if (!mainWrappers?.length) return undefined;
    return mainWrappers[0];
  });

  totalPageCount = computed<number>(() => {
    const primaryFieldGroup = this.fields().fieldGroup;
    if (!primaryFieldGroup?.length) return 0;
    return primaryFieldGroup.length;
  });

  totalFieldCount = computed<number>(() =>
    this.fields().fieldGroup.reduce((count, page) => count + this.countFields(page.fieldGroup), 0),
  );

  currentFormPage = signal<number>(0);
  selectedField = signal<AppFormlyFieldConfig | FormPageContainer | null>(null);

  currentPage = computed(() => this.fields().fieldGroup[this.currentFormPage()]);

  percentageOfCurrentPage = computed<number>(() => {
    return ((this.currentFormPage() + 1) / this.totalPageCount()) * 100;
  });

  private countFields(fields: AppFormlyFieldConfig[]): number {
    return fields.reduce(
      (count, field) =>
        count + 1 + (field.type === 'container-group' ? this.countFields(field.fieldGroup) : 0),
      0,
    );
  }

  /** Replaces the editor state (title, fields and undo history) with a form loaded from the API. */
  load(
    title: string,
    fields: FormFieldConfiguration | undefined,
    settings: FormSettings = DEFAULT_FORM_SETTINGS,
  ): void {
    this.title.set(title);
    this.settings.set({ ...settings });
    this.formTreeHistory.reset(fields ?? this.createDefaultFields());
    this.currentFormPage.set(0);
    this.selectedField.set(null);
  }

  private defaultTitle(): string {
    return this.translate.instant('formBuilder.defaults.formTitle') as string;
  }

  private createDefaultFields(): FormFieldConfiguration {
    return {
      key: ulid(),
      wrappers: ['form-steps'],
      fieldGroup: [
        {
          id: ulid(),
          key: ulid(),
          type: 'container-group',
          props: {
            cols: 1,
            label: this.translate.instant('formBuilder.defaults.pageLabel') as string,
          },
          fieldGroup: [],
        },
      ],
    };
  }

  addPage(page: FormPageContainer): void {
    this.formTreeHistory.update((currentFieldState) => ({
      ...currentFieldState,
      fieldGroup: [...currentFieldState.fieldGroup, page],
    }));
    this.selectedField.set(null);
  }

  serFormViewOption(view: Exclude<FieldWrapperName, 'form-field-container' | 'form-field'> | null) {
    this.formTreeHistory.update((currentFieldState) => ({
      ...currentFieldState,
      wrappers: [view ?? 'form-steps'],
    }));
  }
}
