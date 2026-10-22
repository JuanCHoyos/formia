import { booleanAttribute, Component, input, model, output } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';

import { APP_ICONS } from '../../constants/icons';
import type { OptionSelection } from '../../types/option-selection';
import type { SegmentedControlOption } from '../../types/segmented-control-option';

let nextId = 0;

@Component({
  selector: 'app-segmented-control',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons(APP_ICONS)],
  templateUrl: './segmented-control.html',
})
export class SegmentedControl<T> {
  readonly options = input.required<readonly SegmentedControlOption<T>[]>();
  readonly value = model<T>();
  readonly ariaLabel = input<string>();
  readonly ariaLabelledBy = input<string>();
  readonly stacked = input(false, { transform: booleanAttribute });
  readonly selectionChange = output<OptionSelection<T>>();

  protected readonly name = `segmented-control-${nextId++}`;

  protected select(value: T, element: HTMLElement): void {
    this.value.set(value);
    this.selectionChange.emit({ value, element });
  }
}
