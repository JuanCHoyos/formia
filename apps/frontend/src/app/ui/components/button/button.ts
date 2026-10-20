import { CommonModule } from '@angular/common';
import { booleanAttribute, Component, input, output } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowTopRightOnSquareMicro } from '@ng-icons/heroicons/micro';

import { ButtonModule, ButtonSeverity, ButtonSize, ButtonVariant } from 'primeng/button';
import { Spinner } from '@primeicons/angular/spinner';
import { APP_ICONS } from '../../constants/icons';
import { AppIcon } from '../../types/icons';
export type IconPosition = 'left' | 'right';

@Component({
  imports: [CommonModule, ButtonModule, NgIcon, Spinner],
  providers: [provideIcons(APP_ICONS)],
  selector: 'app-button',
  templateUrl: './button.html',
})
export class Button {
  ariaLabel = input<string>();
  disabled = input<boolean>(false);
  icon = input<AppIcon>();
  iconOnly = input<boolean>(false);
  iconPosition = input<IconPosition>('left');
  loading = input<boolean>(false);
  raised = input<boolean>(false);
  rounded = input<boolean>(false, { transform: booleanAttribute });
  severity = input<ButtonSeverity>();
  size = input<ButtonSize>();
  variant = input<ButtonVariant>();
  customClass = input<string>();
  fill = input<boolean>(false);
  type = input<'button' | 'submit'>('button');
  pressed = output<MouseEvent>();
  preventEventBubbling = input<boolean>(false);

  onPressed($event: PointerEvent) {
    if (this.preventEventBubbling()) {
      $event.stopPropagation();
    }
    this.pressed.emit($event);
  }
}
