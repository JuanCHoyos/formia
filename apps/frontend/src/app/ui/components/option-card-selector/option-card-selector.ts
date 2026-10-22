import { Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { APP_ICONS } from '../../constants/icons';
import type { OptionCardSelectorOption } from '../../types/option-card-selector-option';
import { CommonModule } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-option-card-selector',
  imports: [CommonModule, NgIcon, CheckboxModule],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './option-card-selector.html',
})
export class OptionCardSelector<T> implements FormValueControl<T[]> {
  readonly options = input.required<readonly OptionCardSelectorOption<T>[]>();
  readonly value = model<T[]>([]);

  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  isSelected(value: T): boolean {
    return this.value().includes(value);
  }

  toggleSelection(value: T): void {
    this.touch.emit();
    const selectedValues = this.value();
    this.value.set(
      this.isSelected(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value],
    );
  }
}
