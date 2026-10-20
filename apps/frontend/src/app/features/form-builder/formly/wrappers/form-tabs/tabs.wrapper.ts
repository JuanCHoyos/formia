import { Component, inject, OnInit } from '@angular/core';
import { FieldWrapper, FormlyField } from '@ngx-formly/core';
import type { FormTabsWrapperConfig } from '../../interfaces/wrapper-types/form-wrapper';
import { TabsModule } from 'primeng/tabs';
import { Button } from '@/app/ui/components/button/button';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormStepNavigation } from '../../services/form-step-navigation';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-form-tabs-wrapper',
  templateUrl: './tabs.wrapper.html',
  imports: [CommonModule, ReactiveFormsModule, Button, TabsModule, FormlyField, TranslatePipe],
  providers: [FormStepNavigation],
})
export class FormTabsWrapper extends FieldWrapper<FormTabsWrapperConfig> implements OnInit {
  readonly navigation = inject<FormStepNavigation>(FormStepNavigation);

  ngOnInit(): void {
    this.navigation.initialize(this.field.fieldGroup?.map((step) => step.formControl) ?? []);
  }
}
