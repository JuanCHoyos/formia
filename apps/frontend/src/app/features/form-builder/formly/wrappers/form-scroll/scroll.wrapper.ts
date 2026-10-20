import { Button } from '@/app/ui/components/button/button';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FieldWrapper, FormlyField } from '@ngx-formly/core';
import { Divider } from 'primeng/divider';
import type { FormScrollWrapperConfig } from '../../interfaces/wrapper-types/form-wrapper';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-form-scroll-wrapper',
  templateUrl: './scroll.wrapper.html',
  imports: [CommonModule, Button, Divider, FormlyField, TranslatePipe],
})
export class FormScrollWrapper extends FieldWrapper<FormScrollWrapperConfig> {}
