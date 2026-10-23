import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  input,
  model,
  output,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';

import { APP_ICONS } from '../../constants/icons';
import type { OptionSelection } from '../../types/option-selection';
import type { PreviewCardSelectorOption } from '../../types/preview-card-selector-option';
import { PreviewCardTemplate } from './preview-card-template';

let nextId = 0;

@Component({
  selector: 'app-preview-card-selector',
  imports: [NgTemplateOutlet, NgIcon],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './preview-card-selector.html',
})
export class PreviewCardSelector<T> implements FormValueControl<T | undefined> {
  readonly options = input.required<readonly PreviewCardSelectorOption<T>[]>();
  readonly value = model<T>();
  readonly minItemWidth = input<string>('8rem');
  readonly stretch = input(false, { transform: booleanAttribute });

  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>();
  readonly touch = output<void>();
  readonly selectionChange = output<OptionSelection<T>>();

  protected readonly preview = contentChild(PreviewCardTemplate);
  protected readonly groupName = `preview-card-selector-${nextId++}`;
  protected readonly gridTemplateColumns = computed<string>(
    () =>
      `repeat(${this.stretch() ? 'auto-fit' : 'auto-fill'}, minmax(min(100%, ${this.minItemWidth()}), 1fr))`,
  );

  protected select(value: T, element: HTMLElement): void {
    this.touch.emit();
    this.value.set(value);
    this.selectionChange.emit({ value, element });
  }
}
