import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { FieldType } from '@ngx-formly/core';
import { TranslatePipe } from '@ngx-translate/core';

import { RatingModule } from 'primeng/rating';

import { RatingScale } from '@/app/ui/components/rating-scale/rating-scale';

import type { RatingFieldTypeConfig } from '../../types/field-types/rating-field';

@Component({
  selector: 'formly-field-rating',
  imports: [ReactiveFormsModule, RatingScale, RatingModule, TranslatePipe],
  templateUrl: './rating-field.type.html',
})
export class RatingFieldType extends FieldType<RatingFieldTypeConfig> {}
