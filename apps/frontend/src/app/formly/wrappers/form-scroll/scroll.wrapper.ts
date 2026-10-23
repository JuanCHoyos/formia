import { Component } from '@angular/core';

import { FieldWrapper, FormlyField } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Divider } from 'primeng/divider';

import { Button } from '@/app/ui/components/button/button';

import type { FormScrollWrapperConfig } from '../../types/form-wrapper';

@Component({
  selector: 'app-form-scroll-wrapper',
  templateUrl: './scroll.wrapper.html',
  imports: [Button, Divider, FormlyField, TranslatePipe],
})
export class FormScrollWrapper extends FieldWrapper<FormScrollWrapperConfig> {}
