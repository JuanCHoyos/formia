import { Component, computed, inject } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MessageModule } from 'primeng/message';

import { Button } from '@/app/ui/components/button/button';
import { APP_ICONS } from '@/app/ui/constants/icons';

import type {
  AppFormlyFieldConfig,
  FormPageContainer,
} from '../../../../formly/types/app-formly-field-config';
import type {
  AlertFieldProps,
  CheckboxFieldProps,
  ContainerFieldProps,
  DividerFieldProps,
  HeadingFieldProps,
  ImageFieldProps,
  MatrixFieldProps,
  MultiCheckboxFieldProps,
  ParagraphFieldProps,
  RadioFieldProps,
  RadioImageFieldProps,
  RatingFieldProps,
  SelectFieldProps,
  TextareaFieldProps,
  TextFieldProps,
} from '../../../../formly/types/field-types';
import { FIELD_PALETTE } from '../../constants/field-palette-group';
import { BuilderMenuState } from '../../services/builder-menu-state';
import { FormBuilderStore } from '../../services/form-builder-store';
import type { SelectedFieldSummary } from '../../types/selected-field-summary';
import { AlertFieldConfigForm } from './field-config-forms/alert-field-config-form/alert-field-config-form';
import { CheckboxFieldConfigForm } from './field-config-forms/checkbox-field-config-form/checkbox-field-config-form';
import { ContainerFieldConfigForm } from './field-config-forms/container-field-config-form/container-field-config-form';
import { DividerFieldConfigForm } from './field-config-forms/divider-field-config-form/divider-field-config-form';
import { HeadingFieldConfigForm } from './field-config-forms/heading-field-config-form/heading-field-config-form';
import { ImageFieldConfigForm } from './field-config-forms/image-field-config-form/image-field-config-form';
import { MatrixFieldConfigForm } from './field-config-forms/matrix-field-config-form/matrix-field-config-form';
import { MultiCheckboxFieldConfigForm } from './field-config-forms/multicheckbox-field-config-form/multicheckbox-field-config-form';
import { ParagraphFieldConfigForm } from './field-config-forms/paragraph-field-config-form/paragraph-field-config-form';
import { RadioFieldConfigForm } from './field-config-forms/radio-field-config-form/radio-field-config-form';
import { RadioImageFieldConfigForm } from './field-config-forms/radio-image-field-config-form/radio-image-field-config-form';
import { RatingFieldConfigForm } from './field-config-forms/rating-field-config-form/rating-field-config-form';
import { SelectFieldConfigForm } from './field-config-forms/select-field-config-form/select-field-config-form';
import { TextFieldConfigForm } from './field-config-forms/text-field-config-form/text-field-config-form';
import { TextareaFieldConfigForm } from './field-config-forms/textarea-field-config-form/textarea-field-config-form';
@Component({
  selector: 'app-builder-properties-sidebar',
  templateUrl: './builder-properties-sidebar.html',
  imports: [
    Button,
    TranslatePipe,
    AlertFieldConfigForm,
    HeadingFieldConfigForm,
    ParagraphFieldConfigForm,
    DividerFieldConfigForm,
    ImageFieldConfigForm,
    ContainerFieldConfigForm,
    TextFieldConfigForm,
    TextareaFieldConfigForm,
    CheckboxFieldConfigForm,
    RadioFieldConfigForm,
    RadioImageFieldConfigForm,
    MultiCheckboxFieldConfigForm,
    MatrixFieldConfigForm,
    RatingFieldConfigForm,
    SelectFieldConfigForm,
    MessageModule,
    NgIcon,
  ],
  providers: [provideIcons(APP_ICONS)],
})
export class BuilderPropertiesSidebar {
  readonly menuState = inject(BuilderMenuState);
  readonly formBuilderStore = inject(FormBuilderStore);
  private readonly translate = inject(TranslateService);

  selectedFieldProperties = computed<SelectedFieldSummary>(() => {
    const field = this.formBuilderStore.selectedField();
    const fallback: SelectedFieldSummary = {
      label: field?.type ?? '',
      icon: 'lucideAlertOctagon',
      iconClass: 'bg-brand-soft text-brand-text',
    };
    if (!field) return fallback;
    const fieldOption = FIELD_PALETTE.flatMap((group) => group.items).find(
      (option) => option.type === field.type,
    );
    if (!fieldOption) return fallback;
    return {
      label: this.translate.instant(fieldOption.label) as string,
      icon: fieldOption.icon,
      iconClass: `${fieldOption.bgIcon} ${fieldOption.colorIcon}`,
    };
  });

  selectedFieldLocation = computed(() => {
    const selectedId = this.formBuilderStore.selectedField()?.id;
    if (!selectedId) return null;

    const pages = this.formBuilderStore.fields().fieldGroup;
    for (const [pageIndex, page] of pages.entries()) {
      const position = page.fieldGroup.findIndex(
        (field) =>
          field.id === selectedId ||
          (field.type === 'container-group' &&
            field.fieldGroup.some(({ id }) => id === selectedId)),
      );
      if (position !== -1) {
        return { page: pageIndex + 1, position: position + 1 };
      }
    }
    return null;
  });

  onTextareaPropsChange(change: TextareaFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'textarea') return;
    this.updateSelectedFieldProps(field, change);
  }

  onTextPropsChange(change: TextFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'text') return;
    this.updateSelectedFieldProps(field, change);
  }

  onCheckboxPropsChange(change: CheckboxFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'checkbox') return;
    this.updateSelectedFieldProps(field, change);
  }

  onSelectPropsChange(change: SelectFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'select') return;
    this.updateSelectedFieldProps(field, change);
  }

  onRadioPropsChange(change: RadioFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'radio') return;
    this.updateSelectedFieldProps(field, change);
  }

  onRadioImagePropsChange(change: RadioImageFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'radio-image') return;
    this.updateSelectedFieldProps(field, change);
  }

  onMultiCheckboxPropsChange(change: MultiCheckboxFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'multicheckbox') return;
    this.updateSelectedFieldProps(field, change);
  }

  onMatrixPropsChange(change: MatrixFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'matrix') return;
    this.updateSelectedFieldProps(field, change);
  }

  onRatingPropsChange(change: RatingFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'rating') return;
    this.updateSelectedFieldProps(field, change);
  }

  onHeadingPropsChange(change: HeadingFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'heading') return;
    this.updateSelectedFieldProps(field, change);
  }

  onImagePropsChange(change: ImageFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'image') return;
    this.updateSelectedFieldProps(field, change);
  }

  onParagraphPropsChange(change: ParagraphFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'paragraph') return;
    this.updateSelectedFieldProps(field, change);
  }

  onDividerPropsChange(change: DividerFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'divider') return;
    this.updateSelectedFieldProps(field, change);
  }

  onContainerPropsChange(change: ContainerFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'container-group') return;
    this.updateSelectedFieldProps(field, change);
  }

  onAlertPropsChange(change: AlertFieldProps): void {
    const field = this.formBuilderStore.selectedField();
    if (field?.type !== 'alert') return;
    this.updateSelectedFieldProps(field, change);
  }

  private updateSelectedFieldProps<T extends AppFormlyFieldConfig | FormPageContainer>(
    field: T,
    change: Partial<T['props']>,
  ): void {
    const updatedField = {
      ...field,
      props: {
        ...field.props,
        ...change,
      },
    } as T;

    this.formBuilderStore.formTreeEditor.updateElement(field.id, updatedField);
  }
}
