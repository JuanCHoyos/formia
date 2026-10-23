import { booleanAttribute, Component, input, model, output } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';

import { APP_ICONS } from '../../constants/icons';
import type { OptionListSelectorOption } from '../../types/option-list-selector-option';

let nextId = 0;

@Component({
  selector: 'app-option-list-selector',
  imports: [NgIcon],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './option-list-selector.html',
})
export class OptionListSelector<T> implements FormValueControl<T[]> {
  readonly options = input.required<readonly OptionListSelectorOption<T>[]>();
  readonly value = model<T[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });

  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>();
  readonly touch = output<void>();

  protected readonly groupName = `option-list-selector-${nextId++}`;

  isSelected(value: T): boolean {
    return this.value().includes(value);
  }

  protected select(value: T): void {
    this.touch.emit();
    if (!this.multiple()) {
      this.value.set([value]);
      return;
    }

    const selectedValues = this.value();
    this.value.set(
      this.isSelected(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value],
    );
  }
}
