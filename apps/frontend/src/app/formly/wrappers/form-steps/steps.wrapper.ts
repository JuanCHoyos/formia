import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { FieldWrapper, FormlyField } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import { StepperModule } from 'primeng/stepper';

import { Button } from '@/app/ui/components/button/button';
import { APP_ICONS } from '@/app/ui/constants/icons';

import { FormStepNavigation } from '../../services/form-step-navigation';
import type { FormStepsWrapperConfig } from '../../types/form-wrapper';

@Component({
  selector: 'app-form-steps-wrapper',
  templateUrl: './steps.wrapper.html',
  styles: `
    :host ::ng-deep .p-stepper-separator {
      display: none;
    }
  `,
  imports: [ReactiveFormsModule, Button, StepperModule, FormlyField, NgIcon, TranslatePipe],
  providers: [FormStepNavigation, provideIcons(APP_ICONS)],
})
export class FormStepsWrapper extends FieldWrapper<FormStepsWrapperConfig> implements OnInit {
  readonly navigation = inject(FormStepNavigation);

  ngOnInit(): void {
    this.navigation.initialize(this.field.fieldGroup?.map((step) => step.formControl) ?? []);
  }
}
